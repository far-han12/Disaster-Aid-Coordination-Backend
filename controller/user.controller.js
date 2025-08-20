export const getMe = (req, res) => {
    const user = req.user;
    user.password = undefined;
    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
};