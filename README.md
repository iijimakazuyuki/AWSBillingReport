AWS Billing Report
====================

deploy
--------------------

```
mybucket=bucket-name
version=1.0.0
zip v${version}.zip index.js
aws s3 cp v${version}.zip s3://${mybucket}/v${version}.zip
```
