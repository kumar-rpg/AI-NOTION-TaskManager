const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function notionHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

function checkPin(req, res) {
  const expected = process.env.APP_PIN;
  const provided = req.headers['x-app-pin'];
  if (!expected || provided !== expected) {
    res.status(401).json({ error: 'Invalid or missing PIN' });
    return false;
  }
  return true;
}

function pageToTask(page) {
  return {
    id: page.id,
    taskName: page.properties['Task Name']?.title?.[0]?.plain_text || '',
    status: page.properties['Status']?.select?.name || null,
    startDate: page.properties['Start Date']?.date?.start || null,
    endDate: page.properties['End Date']?.date?.start || null,
    createdTime: page.created_time,
  };
}

function dateProperty(value) {
  return value ? { date: { start: value } } : { date: null };
}

async function listTasks(req, res) {
  const resp = await fetch(`${NOTION_API}/databases/${process.env.NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({ sorts: [{ timestamp: 'created_time', direction: 'descending' }] }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || 'Notion query failed');
  res.status(200).json({ tasks: data.results.map(pageToTask) });
}

async function createTask(req, res) {
  const { taskName, status, startDate, endDate } = req.body || {};
  if (!taskName || !taskName.trim()) {
    return res.status(400).json({ error: 'taskName is required' });
  }
  const properties = {
    'Task Name': { title: [{ text: { content: taskName.trim() } }] },
  };
  if (status) properties['Status'] = { select: { name: status } };
  if (startDate) properties['Start Date'] = dateProperty(startDate);
  if (endDate) properties['End Date'] = dateProperty(endDate);

  const resp = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || 'Notion create failed');
  res.status(200).json(pageToTask(data));
}

async function updateTask(req, res) {
  const { id, taskName, status, startDate, endDate } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id is required' });

  const properties = {};
  if (taskName !== undefined) properties['Task Name'] = { title: [{ text: { content: taskName.trim() } }] };
  if (status !== undefined) properties['Status'] = { select: { name: status } };
  if (startDate !== undefined) properties['Start Date'] = dateProperty(startDate);
  if (endDate !== undefined) properties['End Date'] = dateProperty(endDate);

  const resp = await fetch(`${NOTION_API}/pages/${id}`, {
    method: 'PATCH',
    headers: notionHeaders(),
    body: JSON.stringify({ properties }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || 'Notion update failed');
  res.status(200).json(pageToTask(data));
}

async function deleteTask(req, res) {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const resp = await fetch(`${NOTION_API}/pages/${id}`, {
    method: 'PATCH',
    headers: notionHeaders(),
    body: JSON.stringify({ archived: true }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || 'Notion delete failed');
  res.status(200).json({ ok: true });
}

module.exports = async (req, res) => {
  if (!checkPin(req, res)) return;

  try {
    switch (req.method) {
      case 'GET':
        return await listTasks(req, res);
      case 'POST':
        return await createTask(req, res);
      case 'PATCH':
        return await updateTask(req, res);
      case 'DELETE':
        return await deleteTask(req, res);
      default:
        res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
