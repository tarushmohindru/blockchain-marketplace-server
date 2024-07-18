const passport = require('passport');
exports.isAuth = (req, res, done) => {
    return passport.authenticate('jwt')
}; 
exports.sanitizeUser = (user) =>{
    return {id:user.id, role:user.role}
}
exports.cookieExtractor = function(req) {
        var token = null;
        if (req && req.cookies) {
            token = req.cookies['jwt'];
        }
        // token=  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MjY2MTE2YmNjMzFjZjMwYzQwYTRhMyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzEzNzkxMjgxfQ.YC0WfGLWYN5_c3nDIA1iU6DX0oS3jAXVn-SsMrdJNDk';
        return token;
    };
