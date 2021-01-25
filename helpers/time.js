const moment = require('moment');

module.exports = {
    formatDate: function (date, format) {
        return moment(date).format(format);
    },
    getLastMinute: function (date, hour) {
        return moment(date).startOf(hour).fromNow();
    },
    getYear: function () {
        return new Date().getFullYear()
    }
};