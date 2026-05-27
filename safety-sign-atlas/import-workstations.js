// 从Excel导入工作岗位到安全标志图集系统
// 用法: node import-workstations.js <Excel文件路径> [API地址]
// 示例: node import-workstations.js "PFA3P有限空间管理台账.xlsx"
//       node import-workstations.js "台账.xlsx" http://remote-server:8000

const XLSX = require('xlsx');
const http = require('http');
const https = require('https');
const path = require('path');

const excelFile = process.argv[2];
if (!excelFile) {
    console.error('用法: node import-workstations.js <Excel文件路径> [API地址]');
    console.error('示例: node import-workstations.js "PFA3P有限空间管理台账.xlsx"');
    process.exit(1);
}

const API_BASE = process.argv[3] || 'http://localhost:8000';
const urlObj = new URL(API_BASE);
const isHttps = urlObj.protocol === 'https:';
const httpModule = isHttps ? https : http;

function apiPost(apiPath, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = httpModule.request({
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: '/api' + apiPath,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
                catch (e) { resolve({ status: res.statusCode, body: d }); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('读取Excel文件:', excelFile);
    const wb = XLSX.readFile(excelFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // 解析表头确认格式
    const header = rows[1];
    const nameCol = header.findIndex(h => h && String(h).includes('名称'));
    const locCol = header.findIndex(h => h && String(h).includes('具体位置'));
    const codeCol = header.findIndex(h => h && String(h).includes('编号'));
    const personCol = header.findIndex(h => h && String(h).includes('责任人'));
    const cycleCol = header.findIndex(h => h && String(h).includes('作业周期'));
    const volumeCol = header.findIndex(h => h && String(h).includes('容积'));
    const depthCol = header.findIndex(h => h && String(h).includes('深度'));
    const entranceCol = header.findIndex(h => h && String(h).includes('入口数量'));
    const deptCol = header.findIndex(h => h && String(h).includes('部门'));

    if (nameCol < 0 || locCol < 0) {
        console.error('错误: 未找到"名称"或"具体位置"列，请检查Excel格式');
        process.exit(1);
    }

    // 提取部门名（取第一个数据行的部门值）
    const firstDept = deptCol >= 0 ? String(rows[2][deptCol] || '未知').trim() : '未知';

    console.log('目标服务器:', API_BASE);
    console.log('部门:', firstDept);
    console.log('数据行数:', rows.length - 2, '(从第3行到第', rows.length - 1, '行)');

    // 1. 创建场景
    console.log('\n1. 创建场景...');
    const sceneResult = await apiPost('/scenes', {
        scene_code: 'SCENE-' + firstDept,
        scene_name: firstDept + '有限空间',
        department: firstDept,
        hazard_tags: 'confined',
        location_description: firstDept + '车间',
        installation_notes: '有限空间管理台账导入'
    });

    if (sceneResult.status < 200 || sceneResult.status >= 300) {
        console.error('创建场景失败:', sceneResult.body);
        // 尝试查找已有场景
        console.log('尝试查找已有场景...');
        const scenes = await new Promise((resolve, reject) => {
            httpModule.get(urlObj.hostname + '/api/scenes', res => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve([]); } });
            }).on('error', reject);
        });
        const existing = scenes.find(s => s.scene_name && s.scene_name.includes('有限空间'));
        if (existing) {
            console.log('使用已有场景:', existing.scene_name, '(id=' + existing.id + ')');
            sceneResult.body = { id: existing.id };
        } else {
            console.error('无法创建或找到场景，退出');
            process.exit(1);
        }
    }

    const sceneId = sceneResult.body.id;
    console.log('场景ID:', sceneId);

    // 2. 导入工作岗位
    console.log('\n2. 导入工作岗位...');
    let success = 0, fail = 0;

    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[nameCol]) continue;

        const name = String(row[nameCol]).trim();
        const location = locCol >= 0 ? String(row[locCol]).trim() : '';
        const codeNo = codeCol >= 0 ? String(row[codeCol]).trim() : '';
        const person = personCol >= 0 ? String(row[personCol]).replace(/\r?\n/g, ' ').trim() : '';
        const cycle = cycleCol >= 0 ? String(row[cycleCol]).replace(/\r?\n/g, ' ').trim() : '';
        const volume = volumeCol >= 0 ? String(row[volumeCol]).trim() : '';
        const depth = depthCol >= 0 ? String(row[depthCol]).trim() : '';
        const entrance = entranceCol >= 0 ? String(row[entranceCol]).trim() : '';

        const notesParts = [];
        if (codeNo) notesParts.push('编号: ' + codeNo);
        if (person) notesParts.push('责任人: ' + person);
        if (cycle) notesParts.push('作业周期: ' + cycle);
        if (volume) notesParts.push('容积: ' + volume + '立方米');
        if (depth) notesParts.push('深度: ' + depth + '米');
        if (entrance) notesParts.push('入口数量: ' + entrance);

        const result = await apiPost('/workstations', {
            workstation_code: 'WS-' + firstDept + '-' + String(i - 1).padStart(3, '0'),
            workstation_name: name,
            scene_id: sceneId,
            department: firstDept,
            location: location,
            notes: notesParts.join(' | ')
        });

        if (result.status >= 200 && result.status < 300) {
            success++;
        } else {
            fail++;
            if (fail <= 3) console.log('  失败:', name, JSON.stringify(result.body));
        }

        if ((i - 1) % 20 === 0) process.stdout.write('.');
    }

    console.log('\n\n完成! 成功:', success, '失败:', fail);
    console.log('场景ID:', sceneId, '| 服务器:', API_BASE);
}

main().catch(e => { console.error('执行失败:', e.message); process.exit(1); });
