let currentStep = 0;
const totalSteps = 6;

const stepNames = ['license', 'location', 'server', 'options', 'install', 'complete'];

function updateStepIndicator() {
    document.querySelectorAll('.step').forEach((step, i) => {
        step.classList.remove('active', 'completed');
        if (i === currentStep) {
            step.classList.add('active');
        } else if (i < currentStep) {
            step.classList.add('completed');
        }
    });
}

function showStep(step) {
    document.querySelectorAll('.step-content').forEach((el, i) => {
        el.classList.toggle('active', i === step);
    });
    updateStepIndicator();
    updateNavButtons();
}

function updateNavButtons() {
    const backBtn = document.getElementById('btn-back');
    const nextBtn = document.getElementById('btn-next');

    backBtn.disabled = currentStep === 0;

    if (currentStep === totalSteps - 1) {
        nextBtn.disabled = true;
        nextBtn.textContent = '完成';
    } else if (currentStep === 0) {
        nextBtn.disabled = !document.getElementById('accept-license').checked;
        nextBtn.textContent = '下一步';
    } else if (currentStep === 2) {
        nextBtn.disabled = !document.getElementById('server-url').value.trim();
        nextBtn.textContent = '下一步';
    } else {
        nextBtn.disabled = false;
        nextBtn.textContent = '下一步';
    }
}

function nextStep() {
    if (currentStep < totalSteps - 1) {
        if (currentStep === 3) {
            runInstallation();
        } else {
            currentStep++;
            showStep(currentStep);
        }
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
    }
}

function finish() {
    if (window.wails) {
        window.wails.Quit();
    } else {
        console.log('Installation complete');
    }
}

async function testConnection() {
    const url = document.getElementById('server-url').value.trim();
    const status = document.getElementById('connection-status');

    if (!url) {
        status.textContent = '请输入服务器地址';
        status.className = 'status error';
        return;
    }

    status.textContent = '正在测试连接...';
    status.className = 'status';

    try {
        const resp = await fetch(url + '/api/v1/health', {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        if (resp.ok) {
            status.textContent = '✓ 连接成功';
            status.className = 'status success';
        } else {
            status.textContent = '✗ 服务器返回错误: ' + resp.status;
            status.className = 'status error';
        }
    } catch (e) {
        status.textContent = '✗ 连接失败: ' + e.message;
        status.className = 'status error';
    }
}

async function runInstallation() {
    currentStep = 4;
    showStep(4);

    const installPath = document.getElementById('install-path').value;
    const serverURL = document.getElementById('server-url').value.trim();
    const addToPath = document.getElementById('add-to-path').checked;
    const createShortcut = document.getElementById('create-desktop-shortcut').checked;
    const installSkills = document.getElementById('install-skills').checked;

    const status = document.getElementById('install-status');
    const progress = document.getElementById('progress-fill');

    const steps = [
        { text: '正在安装 ao-cli...', progress: 15 },
        { text: '正在部署技能包...', progress: 40 },
        { text: '正在配置服务器...', progress: 60 },
        { text: '正在设置环境变量...', progress: 80 },
        { text: '正在验证安装...', progress: 95 },
    ];

    for (const s of steps) {
        status.textContent = s.text;
        progress.style.width = s.progress + '%';
        await sleep(400);
    }

    try {
        if (window.wails) {
            const result = await window.wails.Invoke('Install', {
                InstallPath: installPath,
                ServerURL: serverURL,
                AddToPath: addToPath,
                CreateShortcut: createShortcut,
                InstallSkills: installSkills,
            });
            if (result.error) {
                throw new Error(result.error);
            }
        } else {
            await mockInstall(installPath, serverURL, addToPath, installSkills);
        }
    } catch (e) {
        status.textContent = '安装失败: ' + e.message;
        progress.style.width = '0%';
        return;
    }

    progress.style.width = '100%';
    await sleep(300);
    currentStep = 5;
    showStep(5);
}

async function mockInstall(installPath, serverURL, addToPath, installSkills) {
    await sleep(500);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function browseFolder() {
    if (window.wails) {
        window.wails.Invoke('BrowseFolder').then(path => {
            if (path) {
                document.getElementById('install-path').value = path;
            }
        });
    }
}

document.getElementById('accept-license').addEventListener('change', updateNavButtons);
document.getElementById('server-url').addEventListener('input', updateNavButtons);

document.addEventListener('DOMContentLoaded', () => {
    showStep(0);

    if (window.wails) {
        window.wails.Invoke('DetectAgents').then(agents => {
            const list = document.getElementById('agent-list');
            if (agents && agents.length > 0) {
                list.innerHTML = agents.map(a =>
                    `<div class="agent-item"><span class="check">✓</span>${a.Name} (${a.Dir})</div>`
                ).join('');
            } else {
                list.innerHTML = '<p style="color:#86868b;font-size:13px;">未检测到已安装的 AI 助手</p>';
            }
        });
    } else {
        document.getElementById('agent-list').innerHTML =
            '<p style="color:#86868b;font-size:13px;">（非 GUI 环境，跳过 Agent 检测）</p>';
    }
});
