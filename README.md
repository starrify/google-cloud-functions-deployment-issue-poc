## Background

It is assumed to be somehow a common practice to use the pre/post installation hook of npm to perform extra tasks like manipulating files.
However it was earlier observed that on Google Cloud Functions the deployment may not yield the expected results.
This indends to be a minimal, reproducible, and complete example of the very issue.


## Test 1

The initial test configuration comes with these three files as below:

```
$ cat index.js 
module.exports.render = async (req, res) => {
  const util = require('util');
  const exec = util.promisify(require('child_process').exec);
  const {stdout} = await exec('ls -lah . && grep "" foo*');
  res.status(200).send(stdout);
};
$ cat package.json 
{
  "name": "test",
  "main": "index.js",
  "scripts": {
    "postinstall": "echo bar2 > foo2 && echo bar3 > foo3"
  },
  "files": [
    "foo1"
  ]
}
$ cat foo1 
bar1
```

The test function would be then deployed to Google Cloud Functions under a function name that did not previously exist (thus would be newly created than updated):

```
$ gcloud functions deploy foo-test --runtime nodejs10 --trigger-http --entry-point render --allow-unauthenticated | tee tmp.log | grep -P "status|version"
Deploying function (may take a while - up to 2 minutes)...done.
status: ACTIVE
versionId: '1'
```

Below is the sample result which looks all good.
```
$ curl $TEST_FUNCTION_URL
total 0
drwxr-xr-x 2 www-data www-data   0 Jan  1  1980 .
drwxr-xr-x 2 root     root       0 May 27 03:03 ..
-rwxr-xr-x 1 www-data www-data 352 Jan  1  1980 README.md
-rwxr-xr-x 1 www-data www-data   5 Jan  1  1980 foo1
-rw-r--r-- 1 www-data www-data   5 Jan  1  1980 foo2
-rw-r--r-- 1 www-data www-data   5 Jan  1  1980 foo3
-rwxr-xr-x 1 www-data www-data 235 Jan  1  1980 index.js
drwxr-xr-x 2 www-data www-data   0 Jan  1  1980 node_modules
-rw-r--r-- 1 www-data www-data  45 Jan  1  1980 package-lock.json
-rwxr-xr-x 1 www-data www-data 150 Jan  1  1980 package.json
foo1:bar1
foo2:bar2
foo3:bar3
```

## Test 2

The a minor change has been made to the files that are generated during the postinstall hook:

```
$ git diff --unified=0
diff --git a/package.json b/package.json
index 06b7216..d2cb151 100644
--- a/package.json
+++ b/package.json
@@ -5 +5 @@
-    "postinstall": "echo bar2 > foo2 && echo bar3 > foo3"
+    "postinstall": "echo bar3 > foo3 && echo bar4 > foo4"
```

Below is the sample result after a redeployment:
```
$ gcloud functions deploy foo-test --runtime nodejs10 --trigger-http --entry-point render --allow-unauthenticated | tee tmp.log | grep -P "status|version"
Deploying function (may take a while - up to 2 minutes)...done.
status: ACTIVE
versionId: '2'
$ curl $TEST_FUNCTION_URL
total 1.5K
drwxr-xr-x 2 www-data www-data    0 Jan  1  1980 .
drwxr-xr-x 2 root     root        0 May 27 03:10 ..
-rwxr-xr-x 1 www-data www-data 2.0K Jan  1  1980 README.md
-rwxr-xr-x 1 www-data www-data    5 Jan  1  1980 foo1
-rwxr-xr-x 1 www-data www-data  235 Jan  1  1980 index.js
drwxr-xr-x 2 www-data www-data    0 Jan  1  1980 node_modules
-rw-r--r-- 1 www-data www-data   45 Jan  1  1980 package-lock.json
-rwxr-xr-x 1 www-data www-data  150 Jan  1  1980 package.json
bar1
```

This is rather unexpected as we may assume to see files `foo3` and `foo4` here.
