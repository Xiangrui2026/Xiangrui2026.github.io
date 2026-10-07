# Joesph

Joesph 的个人网站，使用 Hugo 和 Hugo NexT 主题生成静态 HTML。页面与文章都以 Markdown 编写。

## 本地预览

安装 Hugo Extended、Go 和 Dart Sass 后，在仓库根目录执行：

```powershell
hugo server
```

Hugo 会从 `hugo.yaml` 中的模块依赖加载 NexT 主题。

## 页面

- 文章：`content/posts/`
- 归档：`content/archives/_index.md`
- 展示：`content/showcase/_index.md`
- 关于我：`content/about/_index.md`

## GitHub Pages

`.github/workflows/hugo.yaml` 会在推送到 `main` 后构建并部署到 GitHub Pages。仓库的 Pages 来源需要设置为 **GitHub Actions**。
