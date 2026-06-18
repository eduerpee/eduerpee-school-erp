const db = require('../config/database');
const { AppError } = require('../utils/AppError');

const getRoutes = async (req, res) => {
  const rows = await db.queryAll('SELECT * FROM get_transport_routes($1)', [req.schoolId]);
  res.json({ success:true, data:rows });
};

const createRoute = async (req, res) => {
  const { routeName, routeNo, startPoint, endPoint, distanceKm, monthlyFee } = req.body;
  if (!routeName) throw new AppError('Route name required', 400);
  await db.query('CALL save_transport_route($1,NULL,$2,$3,$4,$5,$6,$7,NULL)',
    [req.schoolId, routeName.trim(), routeNo||null, startPoint||null, endPoint||null, distanceKm||null, monthlyFee||null]);
  const route = await db.queryOne('SELECT * FROM transport_routes WHERE school_id=$1 AND route_name=$2 ORDER BY id DESC LIMIT 1',
    [req.schoolId, routeName.trim()]);
  res.status(201).json({ success:true, data:route, message:'Route "'+routeName+'" saved' });
};

const updateRoute = async (req, res) => {
  const { routeName, routeNo, startPoint, endPoint, distanceKm, monthlyFee } = req.body;
  await db.query('CALL save_transport_route($1,$2,$3,$4,$5,$6,$7,$8,NULL)',
    [req.schoolId, req.params.id, routeName||null, routeNo||null, startPoint||null, endPoint||null, distanceKm||null, monthlyFee||null]);
  const route = await db.queryOne('SELECT * FROM transport_routes WHERE id=$1', [req.params.id]);
  res.json({ success:true, data:route, message:'Route updated' });
};

const getVehicles = async (req, res) => {
  const rows = await db.queryAll('SELECT * FROM get_vehicles($1)', [req.schoolId]);
  res.json({ success:true, data:rows });
};

const createVehicle = async (req, res) => {
  const { registrationNo, vehicleType, makeModel, capacity, routeId, driverId, fitnessExpiry, insuranceExpiry } = req.body;
  if (!registrationNo) throw new AppError('Registration number required', 400);
  const validTypes = ['school_bus','van','auto'];
  const vType = validTypes.includes(vehicleType)?vehicleType:'school_bus';
  const vehicle = await db.queryOne(
    `INSERT INTO vehicles (school_id,registration_no,vehicle_type,make_model,capacity,route_id,driver_id,fitness_expiry,insurance_expiry,is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE) RETURNING *, vehicle_type::text as vehicle_type`,
    [req.schoolId, registrationNo.toUpperCase().trim(), vType, makeModel||null, capacity||null,
     routeId||null, driverId||null, fitnessExpiry||null, insuranceExpiry||null]
  );
  res.status(201).json({ success:true, data:vehicle, message:'Vehicle saved' });
};

const updateVehicle = async (req, res) => {
  const { registrationNo, vehicleType, makeModel, capacity, routeId, driverId, fitnessExpiry, insuranceExpiry, isActive } = req.body;
  const v = await db.queryOne(
    `UPDATE vehicles SET
       registration_no=COALESCE($1,registration_no), vehicle_type=COALESCE($2::transport_type,vehicle_type),
       make_model=COALESCE($3,make_model), capacity=COALESCE($4,capacity),
       route_id=COALESCE($5,route_id), driver_id=COALESCE($6,driver_id),
       fitness_expiry=COALESCE($7,fitness_expiry), insurance_expiry=COALESCE($8,insurance_expiry),
       is_active=COALESCE($9,is_active)
     WHERE id=$10 AND school_id=$11 RETURNING *, vehicle_type::text as vehicle_type`,
    [registrationNo||null, vehicleType||null, makeModel||null, capacity||null,
     routeId||null, driverId||null, fitnessExpiry||null, insuranceExpiry||null,
     isActive!==undefined?isActive:null, req.params.id, req.schoolId]
  );
  if (!v) throw new AppError('Vehicle not found', 404);
  res.json({ success:true, data:v });
};

module.exports = { getRoutes, createRoute, updateRoute, getVehicles, createVehicle, updateVehicle };
