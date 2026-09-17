# 启动说明

## 1. 前端

根目录安装依赖：

```bash
npm ci
```

启动各端：

```bash
npm run dev -w apps/web-store -- --host 127.0.0.1 --port 5173 --strictPort
npm run dev -w apps/operation-admin -- --host 127.0.0.1 --port 5174 --strictPort
npm run dev -w apps/distributor-admin -- --host 127.0.0.1 --port 5175 --strictPort
```

以上三个命令分别在独立终端运行。客户端为 `http://localhost:5173`，运营后台为 `http://localhost:5174`，分销商后台为 `http://localhost:5175`。前端默认访问本地 `8080` 端口的后端。

构建各端：

```bash
npm run build:web
npm run build:distributor
npm run build:operation
```

## 2. 后端

需要 Java 17 和 Maven。进入后端目录构建并执行测试：

```bash
cd server
mvn package
```

第一次启动后端并初始化本地演示数据库（从 `server` 目录继续）：

```bash
cd saimeng-admin
java -Dfile.encoding=UTF-8 -jar target/saimeng-admin-0.1.0-SNAPSHOT.jar --spring.sql.init.mode=always --server.address=127.0.0.1
```

之后启动已有数据库时，使用 `--spring.sql.init.mode=never`，避免再次执行演示数据初始化。保持在 `server/saimeng-admin` 目录启动，以使用同一个 `data/saimeng-mall` 数据文件。

健康检查接口：

```bash
GET /api/health
```

## 3. 本地数据与 AI 接入

当前开发环境使用嵌入式 H2 文件数据库，无需额外启动 MySQL 或 Redis。数据库文件、运行日志、构建产物和本地密钥配置不提交到 Git。

运营工作台固定使用 Kimi K3。通过后端进程环境变量 `MOONSHOT_API_KEY` 注入密钥后重启后端；当前没有自动读取 `.env` 的逻辑。生图适配器等待后续接入 Lovart。详见 [AI 工作台接入说明](./ai-workbench.md)。

## 4. 当前技术定版

- ORM：`MyBatis-Plus`
- 权限：`Spring Security`，目前 Token 为本地开发用的轻量实现，尚未实现正式 JWT 签名校验。

当前不引入 `Sa-Token`，避免在认证骨架尚未稳定时切换权限方案。
