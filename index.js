const aws = require('aws-sdk');
const { URL } = require('url');
const https = require('https');
const cloudwatch = new aws.CloudWatch({
    region: 'us-east-1',
});
const webhookUrl = new URL(process.env.WEBHOOK_URL);

async function getBillingReport(startTime, endTime) {
    return new Promise((resolve, reject) => cloudwatch.getMetricStatistics({
        MetricName: 'EstimatedCharges',
        Namespace: 'AWS/Billing',
        Period: 86400,
        StartTime: startTime,
        EndTime: endTime,
        Statistics: ['Maximum'],
        Dimensions: [{ Name: 'Currency', Value: 'USD' }]
    }, function (err, data) {
        if (err) {
            return reject(err);
        }
        let datapoints = data['Datapoints'];
        if (datapoints.length < 1) {
            return reject('no datapoints');
        }

        let latestData = datapoints[datapoints.length - 1];
        let dateString = [startTime.getFullYear(), startTime.getMonth() + 1, startTime.getDate()].join("/");
        return resolve({
            text: `${dateString} ${latestData['Maximum']}`,
        });
    }));
}
async function postMessage(message) {
    return new Promise((resolve, reject) => {
        var request = https.request({
            method: "POST",
            hostname: webhookUrl.hostname,
            path: webhookUrl.pathname,
            headers: {
                'Content-Type': 'application/json',
            },
        }, response => {
            let rawData = '';
            response.on('data', (chunk) => { rawData += chunk; });
            response.on('end', () => {
                if (response.statusCode === 200) {
                    resolve(rawData);
                }
                else {
                    reject(rawData);
                }
            });
        });
        request.write(JSON.stringify(message));
        request.on('error', reject);
        request.end();
    });
}
exports.handler = async (event) => {
    let startDate = new Date();
    try {
        startDate.setDate(startDate.getDate() - 1);
        let message = await getBillingReport(startDate, new Date());
        return await postMessage(message);
    }
    catch (error) {
        return error;
    }
};
