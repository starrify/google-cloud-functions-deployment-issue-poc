module.exports.render = async (req, res) => {
  const util = require('util');
  const exec = util.promisify(require('child_process').exec);
  const {stdout} = await exec('ls -lah . && grep "" foo*');
  res.status(200).send(stdout + '\nand light of stars was in her hair');
};
