// these are designed to tap into the Lambda ENV variables

module.exports = {
    user: process.env.user,
    password: process.env.password,
    device: process.env.device,
};
