const db = require('../config/database');

const getDashboard = async (req, res) => {
  const schoolId = req.schoolId;
  const today    = new Date().toISOString().split('T')[0];

  const [stats, recentAdmissions, notices, monthlyCollection, classWiseFees] = await Promise.all([
    db.queryOne('SELECT * FROM get_dashboard_stats($1,$2)', [schoolId, today]),
    db.queryAll('SELECT * FROM get_recent_admissions($1,$2)', [schoolId, 30]),
    db.queryAll('SELECT * FROM get_recent_notices($1,$2)',    [schoolId, 5]),
    db.queryAll('SELECT * FROM get_monthly_collection($1,$2)',[schoolId, 7]),
    db.queryAll('SELECT * FROM get_classwise_fees($1)',        [schoolId]),
  ]);

  const totalStudents = parseInt(stats?.total_students || 0);
  const todayPresent  = parseInt(stats?.today_present  || 0);

  res.json({
    success: true,
    data: {
      stats: {
        total_students:          totalStudents,
        total_employees:         parseInt(stats?.total_employees || 0),
        total_classes:           parseInt(stats?.total_classes   || 0),
        open_enquiries:          parseInt(stats?.open_enquiries  || 0),
        todayAttendancePercent:  totalStudents > 0
                                   ? ((todayPresent / totalStudents) * 100).toFixed(1)
                                   : 0,
        todayCollection:         parseFloat(stats?.today_collection || 0),
      },
      pendingFees: {
        students_with_dues: parseInt(stats?.pending_students || 0),
        total_pending:      parseFloat(stats?.total_pending  || 0),
      },
      recentAdmissions,
      notices,
      monthlyCollection,
      classWiseFees,
    }
  });
};

module.exports = { getDashboard };
