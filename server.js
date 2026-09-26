// 云端之巅 · Supabase 中转（Render 版，零依赖）
//
// 作用：把 /auth/v1/* 和 /rest/v1/* 原样转发给 Supabase，其他路径一律拒绝。
// 为什么需要：supabase.co 在国内被按域名阻断；netlify.app 在部分手机流量下也被挡；
//             onrender.com 实测在国内流量下能打开。
//
// Render 上部署：New → Web Service → 连一个仓库 → Runtime 选 Node
//                Start Command 填：node server.js
//                实例类型选 Free

const http = require('http');
const https = require('https');

const MUBIAO = 'ttubkzjsxpvjqtqfmyxr.supabase.co';
const DUAN_KOU = process.env.PORT || 10000;

const fuwu = http.createServer((qiu, ying) => {
	// 只放行 Supabase 的两个接口前缀，省得被当成公共代理乱用
	if (!qiu.url.startsWith('/auth/v1/') && !qiu.url.startsWith('/rest/v1/')) {
		ying.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
		ying.end('云端之巅中转服务在运行。');
		return;
	}

	const tou = Object.assign({}, qiu.headers);
	delete tou.host;
	delete tou['content-length'];
	delete tou['accept-encoding'];   // 让上游别压缩，省得我们还得解

	const shang = https.request({
		host: MUBIAO,
		path: qiu.url,
		method: qiu.method,
		headers: tou,
		timeout: 20000,
	}, (hui) => {
		const chu = Object.assign({}, hui.headers);
		delete chu['content-encoding'];
		delete chu['content-length'];
		delete chu['transfer-encoding'];
		ying.writeHead(hui.statusCode || 502, chu);
		hui.pipe(ying);
	});

	shang.on('timeout', () => { shang.destroy(); });
	shang.on('error', (e) => {
		try { ying.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' }); ying.end('上游出错：' + e.message); } catch (_) {}
	});

	qiu.pipe(shang);
});

fuwu.listen(DUAN_KOU, () => {
	console.log('云端之巅中转已启动，端口 ' + DUAN_KOU);
});
