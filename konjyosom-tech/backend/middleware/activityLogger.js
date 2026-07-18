const ActivityLog = require('../models/ActivityLog');

const logActivity = (action, entityType = null) => {
  return async (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;

    res.end = function(chunk, encoding) {
      // Restore original end
      res.end = originalEnd;
      res.end(chunk, encoding);

      // Log activity after response
      if (req.user) {
        ActivityLog.create({
          user: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          action: action,
          entityType: entityType,
          entityId: req.params.id || req.body.id || null,
          details: {
            method: req.method,
            path: req.path,
            body: req.method !== 'GET' ? req.body : undefined,
            statusCode: res.statusCode
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }).catch(err => console.error('Activity log error:', err));
      }
    };

    next();
  };
};

module.exports = { logActivity };
