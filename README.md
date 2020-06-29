# make-data-for-dvfcloud

generate dvfcloud available data from cloud platform

云平台数据迁移到云脉主要分为三个部分，云平台数据的下载、改造以及从云脉后台返回数据。

- 云平台数据的下载

  需要根据医院的账号下载所有已完成的 case，并通过 case 信息下载所有云脉所需的文件及 meta 信息。当前通过 case 信息能够下载到云脉所需的文件。

  ```
  HT-19AMU3
     |
     HT-19SRYJ_aorta+both.ply.zip(包含ply, vtp)
     report.pdf
     humbnail.jpeg
     meta.json(由case信息生成的文件)
  ```

- 云平台数据的改造

  当前从平台下载的数据需要转换为云脉所识别的数据格式，详见[T7992](https://pha.curacloudplatform.com/T7992)。

- 云脉后台返回数据

  需要将前一步改造的数据从云脉后台返回至相应医院，
