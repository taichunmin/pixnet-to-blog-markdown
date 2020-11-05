# pixnet-to-blog-markdown

將痞客邦部落格匯出 MT 格式備份檔處理成 GitHub Markdown

## 安裝

* 安裝 `node v14+` 以及 `yarn` 後，執行以下指令:

```bash
git clone https://github.com/taichunmin/pixnet-to-blog-markdown.git
cd pixnet-to-blog-markdown
yarn
```

## 使用方法

將匯出檔案放於 `pixnet/` 資料夾下，然後執行以下指令即可:

```bash
yarn build
```

處理完成的檔案會放於 `out/` 資料夾下。
