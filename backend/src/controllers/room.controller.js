const db = require('../config/database');
const { AppError } = require('../utils/AppError');

// GET /api/rooms — uses FUNCTION
const getRooms = async (req, res) => {
  const rows = await db.queryAll('SELECT * FROM get_rooms($1)', [req.schoolId]);
  res.json({ success:true, data:rows });
};

// POST /api/rooms — uses PROCEDURE
const createRoom = async (req, res) => {
  const { roomNo, roomName, floor, capacity, roomType } = req.body;
  if (!roomNo) throw new AppError('Room number required', 400);
  await db.query('CALL create_room($1,$2,$3,$4,$5,$6)',
    [req.schoolId, roomNo.trim(), roomName||null, floor||null,
     parseInt(capacity)||40, roomType||'classroom']);
  const room = await db.queryOne(
    'SELECT * FROM rooms WHERE school_id=$1 AND room_no=$2 ORDER BY created_at DESC LIMIT 1',
    [req.schoolId, roomNo.trim()]
  );
  res.status(201).json({ success:true, data:room, message:`Room ${roomNo} created` });
};

// PUT /api/rooms/:id — uses PROCEDURE
const updateRoom = async (req, res) => {
  const { roomNo, roomName, floor, capacity, roomType, isActive } = req.body;
  await db.query('CALL update_room($1,$2,$3,$4,$5,$6,$7,$8)',
    [req.params.id, req.schoolId,
     roomNo||null, roomName||null, floor||null,
     capacity ? parseInt(capacity) : null,
     roomType||null,
     isActive !== undefined ? isActive : null]);
  const room = await db.queryOne('SELECT * FROM rooms WHERE id=$1', [req.params.id]);
  if (!room) throw new AppError('Room not found', 404);
  res.json({ success:true, data:room, message:'Room updated' });
};

// DELETE /api/rooms/:id — uses PROCEDURE
const deleteRoom = async (req, res) => {
  await db.query('CALL delete_room($1,$2)', [req.params.id, req.schoolId]);
  res.json({ success:true, message:'Room removed' });
};

// POST /api/rooms/:id/allocate — uses PROCEDURE
const allocateRoom = async (req, res) => {
  const { classId, sectionId } = req.body;
  if (!classId) throw new AppError('classId required', 400);
  const ay = await db.queryOne(
    'SELECT id FROM academic_years WHERE school_id=$1 AND is_current=TRUE LIMIT 1',
    [req.schoolId]
  );
  await db.query('CALL allocate_room($1,$2,$3,$4,$5)',
    [req.params.id, req.schoolId, classId, sectionId||null, ay?.id||null]);
  const rows = await db.queryAll('SELECT * FROM get_rooms($1)', [req.schoolId]);
  const room  = rows.find(r => r.id === req.params.id);
  res.json({ success:true, data:room, message:'Room allocated successfully' });
};

// DELETE /api/rooms/:id/allocate — uses PROCEDURE
const deallocateRoom = async (req, res) => {
  await db.query('CALL deallocate_room($1,$2)', [req.params.id, req.schoolId]);
  res.json({ success:true, message:'Allocation removed' });
};

module.exports = { getRooms, createRoom, updateRoom, deleteRoom, allocateRoom, deallocateRoom };
