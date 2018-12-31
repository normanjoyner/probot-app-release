/** Copyright (c) 2017 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const getConfig = require('probot-config');

const parseTitle = require('./parse-title.js');

module.exports = robot => {
  robot.on('pull_request.closed', landed);

  async function landed(context) {
    const config = await getConfig(context, 'release.yml', {}, {});

    if (!config.enabled) {
      return;
    }

    const pr = context.payload.pull_request;

    if (!pr.merged) {
      return;
    }

    const {github} = context;
    const labels = await github.issues.getIssueLabels(context.issue());

    const releaseLabel = config.label || 'release';

    const isRelease = labels.data.some(label => label.name === releaseLabel);

    if (!isRelease) {
      return;
    }

    const {version: tag_name, prerelease} = parseTitle(pr.title);

    github.repos.createRelease(
      context.repo({
        tag_name,
        prerelease,
        name: tag_name,
        target_commitish: pr.merge_commit_sha,
      }),
    );
  }
};
