const { alertRepo, activityRepo } = require('../models/dataRepository');
const { emitAlert } = require('../services/socketService');

const getAlerts = async (req, res, next) => {
  try {
    const { severity, resolved, ward } = req.query;
    const filter = {};

    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (ward) filter.ward = ward;

    const alerts = await alertRepo.find(filter);

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (err) {
    next(err);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await alertRepo.findById(id);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    const updated = await alertRepo.updateById(alert._id, {
      resolved: true,
      resolvedBy: req.user?._id,
      resolvedAt: new Date(),
    });

    await activityRepo.create({
      user: req.user?._id,
      userName: req.user?.name || 'User',
      action: `Resolved alert ${alert._id}`,
      entityType: 'alert',
      entityId: String(alert._id),
      details: { alertType: alert.alertType, binId: alert.binId },
    });

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully.',
      alert: updated,
    });
  } catch (err) {
    next(err);
  }
};

const getAlertSummary = async (req, res, next) => {
  try {
    const allAlerts = await alertRepo.find({});
    const active = allAlerts.filter((a) => !a.resolved);
    const resolved = allAlerts.filter((a) => a.resolved);

    const severityCounts = {
      critical: active.filter((a) => a.severity === 'critical').length,
      high: active.filter((a) => a.severity === 'high').length,
      medium: active.filter((a) => a.severity === 'medium').length,
      low: active.filter((a) => a.severity === 'low').length,
    };

    res.status(200).json({
      success: true,
      summary: {
        total: allAlerts.length,
        activeCount: active.length,
        resolvedCount: resolved.length,
        severityCounts,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAlerts,
  resolveAlert,
  getAlertSummary,
};
