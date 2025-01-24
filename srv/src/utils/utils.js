const adjustDate = (oldDate) => {
    const regex = /24:00:00/g;
    return oldDate.replace(regex, "23:59:59");
}

module.exports = { adjustDate };