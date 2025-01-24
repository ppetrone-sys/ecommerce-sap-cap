const cds = require("@sap/cds");
const LOG = cds.log("keymapping-logger");
const { getDestination } = require("@sap-cloud-sdk/connectivity");

const postToDestination = async (destinationName, url, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const destination = await getDestination({ destinationName: destinationName });
            LOG.info(destination)

            const SapCfAxios = require('sap-cf-axios').default;
            const DMSaxios = SapCfAxios(destinationName);

            const response = await DMSaxios({
                url: url,
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "cache-control": "no-cache",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                    "Access-Control-Allow-Headers": "Content-Type, Accept",
                    "Access-Control-Allow-Origin": "*",
                    "Authorization": destination?.proxyConfiguration?.headers
                },
                data: data

            });

            resolve();
        } catch (error) {
            LOG.error('Post destinations error: ', error)
            reject(error);
        }
    });

};

module.exports = postToDestination;
