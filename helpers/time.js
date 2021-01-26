const moment = require('moment');

module.exports = {
    formatDate: function (date, format) {
        return moment(date).format(format);
    },
    getLastMinute: function (date) {
        return moment(date).startOf('seconds').fromNow();
    },
    getYear: function () {
        return new Date().getFullYear()
    }
};