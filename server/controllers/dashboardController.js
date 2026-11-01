const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const { LEAD_STATUSES } = require('../utils/constants');
const { asyncHandler } = require('../utils/helpers');

exports.getStats = asyncHandler(async (req, res) => {
  // Aggregation does not cast strings to ObjectId, so cast manually.
  const match = { isDeleted: false };
  if (req.user.role !== 'admin') {
    match.assignedTo = new mongoose.Types.ObjectId(String(req.user._id));
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [result] = await Lead.aggregate([
    { $match: match },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        last7Days: [{ $match: { createdAt: { $gte: since } } }, { $count: 'count' }],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          { $project: { name: 1, status: 1, createdAt: 1 } },
        ],
      },
    },
  ]);

  // Fill missing statuses with 0 so the client always gets a stable shape.
  const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0]));
  result.byStatus.forEach(({ _id, count }) => {
    if (_id in byStatus) byStatus[_id] = count;
  });

  res.json({
    totalLeads: result.total[0]?.count || 0,
    leadsByStatus: byStatus,
    leadsLast7Days: result.last7Days[0]?.count || 0,
    recentLeads: result.recent,
  });
});
