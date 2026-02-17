// ========== 全局变量 ==========
let currentMode = 2;
let targetTime = 0;
let currentStep = 1;
let inputValues = { a: '', b: '', c: '' };
let sumAB = 0;
let isAnimating = false;
let displayValue = '0';

// ========== DOM 元素 ==========
const modeBtns = document.querySelectorAll( '.mode-btn' );
const displayHistory = document.getElementById( 'display-history' );
const displayCurrent = document.getElementById( 'display-current' );
const statusMode = document.getElementById( 'status-mode' );
const statusStep = document.getElementById( 'status-step' );
const statusSum = document.getElementById( 'status-sum' );
const stepDots = document.querySelectorAll( '.step-dot' );
const stepLines = document.querySelectorAll( '.step-line' );
const numberKeys = document.querySelectorAll( '.key-number' );
const btnClear = document.getElementById( 'btn-clear' );
const btnDelete = document.getElementById( 'btn-delete' );
const btnNext = document.getElementById( 'btn-next' );
const btnMagic = document.getElementById( 'btn-magic' );
const resultSection = document.getElementById( 'result-section' );
const resultContent = document.getElementById( 'result-content' );
const resultHighlight = document.getElementById( 'result-highlight' );
const resetBtn = document.getElementById( 'reset-btn' );
const fireworksCanvas = document.getElementById( 'fireworks-canvas' );
const greetingOverlay = document.getElementById( 'greeting-overlay' );
const greetingYear = document.getElementById( 'greeting-year' );
const closeGreeting = document.getElementById( 'close-greeting' );

// ========== 初始化 ==========
document.addEventListener( 'DOMContentLoaded', () => {
    initMode();
    initKeypad();
    initFireworks();
    fetchTargetTime();
    greetingYear.textContent = new Date().getFullYear();
    updateDisplay();
    updateStatus();
    updateStepIndicator();
} );

// ========== 模式切换 ==========
function initMode() {
    modeBtns.forEach( btn => {
        btn.addEventListener( 'click', async () => {
            modeBtns.forEach( b => b.classList.remove( 'active' ) );
            btn.classList.add( 'active' );
            currentMode = parseInt( btn.dataset.mode );

            statusMode.textContent = currentMode === 2 ? '🧧 春晚模式' : '🕐 实时模式';

            await fetchTargetTime();
            resetCalculator();
        } );
    } );
}

// ========== 获取目标时间 ==========
async function fetchTargetTime() {
    try {
        const response = await fetch( '/api/get_target_time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { mode: currentMode } )
        } );
        const result = await response.json();
        if ( result.success ) {
            targetTime = result.target;
            console.log( '目标时间:', targetTime );
        }
    } catch ( error ) {
        console.error( '获取目标时间失败:', error );
    }
}

// ========== 键盘初始化 ==========
function initKeypad() {
    // 数字键
    numberKeys.forEach( key => {
        key.addEventListener( 'click', () => {
            if ( isAnimating ) return;
            handleNumberInput( key.dataset.value );
            updateButtons();
        } );
    } );

    // 清除键
    btnClear.addEventListener( 'click', () => {
        if ( isAnimating ) return;
        handleClear();
    } );

    // 删除键
    btnDelete.addEventListener( 'click', () => {
        if ( isAnimating ) return;
        handleDelete();
        updateButtons();
    } );

    // 下一步键
    btnNext.addEventListener( 'click', () => {
        if ( isAnimating ) return;
        handleNextStep();
    } );

    // 魔术键
    btnMagic.addEventListener( 'click', () => {
        if ( isAnimating ) return;
        performMagic();
    } );

    // 重置键
    resetBtn.addEventListener( 'click', () => {
        resetCalculator();
    } );

    // 键盘支持
    document.addEventListener( 'keydown', handleKeyboard );
}

// ========== 数字输入处理 ==========
function handleNumberInput( value ) {
    if ( currentStep > 3 ) return;

    if ( displayValue === '0' ) {
        displayValue = value;
    } else {
        displayValue += value;
    }

    // 限制最大长度
    if ( displayValue.length > 10 ) {
        displayValue = displayValue.slice( 0, 10 );
    }

    updateDisplay();
    updateButtons();
}

// ========== 清除 ==========
function handleClear() {
    displayValue = '0';
    inputValues[ getCurrentStepKey() ] = '';
    updateDisplay();
    updateButtons();
}

// ========== 删除 ==========
function handleDelete() {
    if ( displayValue.length > 1 ) {
        displayValue = displayValue.slice( 0, -1 );
    } else {
        displayValue = '0';
    }
    updateDisplay();
    updateButtons();
}

// ========== 更新按钮状态 ==========
function updateButtons() {
    // 第 1-2 步：下一步按钮
    if ( currentStep <= 2 && displayValue !== '0' && displayValue !== '' ) {
        btnNext.disabled = false;
    } else {
        btnNext.disabled = true;
    }

    // 第 3 步：见证奇迹按钮
    if ( currentStep === 3 && displayValue !== '0' && displayValue !== '' && sumAB > 0 && sumAB < targetTime ) {
        btnMagic.disabled = false;
        btnNext.style.display = 'none';  // 第三步隐藏下一步按钮
    } else {
        if ( currentStep < 3 ) {
            btnNext.style.display = 'flex';
        }
    }
}

// ========== 下一步处理 ==========
function handleNextStep() {
    if ( displayValue === '0' || displayValue === '' ) {
        showError( '⚠️ 请先输入数字！' );
        return;
    }

    // 保存当前输入
    const key = getCurrentStepKey();
    inputValues[ key ] = displayValue;

    console.log( `步骤 ${currentStep} 输入：${inputValues[ key ]}` );

    // 更新和
    if ( currentStep === 2 ) {
        sumAB = parseInt( inputValues.a || 0 ) + parseInt( inputValues.b || 0 );
        statusSum.textContent = `和：${sumAB.toLocaleString()}`;

        if ( sumAB >= targetTime ) {
            showError( `⚠️ 和太大了！请确保小于 ${targetTime.toLocaleString()}` );
            return;
        }

        showToast( `📊 前两次和：${sumAB.toLocaleString()}` );
    }

    // 进入下一步
    if ( currentStep < 3 ) {
        currentStep++;
        displayValue = '0';
        updateDisplay();
        updateStepIndicator();
        updateStatus();
        updateButtons();

        // 第三步提示
        if ( currentStep === 3 ) {
            showToast( '💡 输入任意数字，然后点击"见证奇迹"' );
        }
    }
}

// ========== 执行魔术 ==========
async function performMagic() {
    if ( currentStep < 3 ) {
        showError( '⚠️ 请完成所有三个步骤！' );
        return;
    }

    const userC = displayValue.replace( /,/g, '' );
    if ( !userC || userC === '0' ) {
        showError( '⚠️ 请输入第三个数字！' );
        return;
    }

    isAnimating = true;
    btnMagic.classList.add( 'loading' );
    btnMagic.disabled = true;

    try {
        // 计算预设结果
        const forcedC = targetTime - sumAB;

        // 数字滚动动画
        let currentVal = parseInt( userC ) || 0;
        const steps = 30;
        const increment = ( forcedC - currentVal ) / steps;
        let step = 0;

        const rollAnimation = setInterval( () => {
            step++;
            currentVal += increment;

            if ( step >= steps ) {
                currentVal = forcedC;
                clearInterval( rollAnimation );

                displayValue = currentVal.toLocaleString();
                inputValues.c = currentVal.toString();
                updateDisplay();

                displayCurrent.classList.add( 'magic' );

                setTimeout( () => {
                    displayCurrent.classList.remove( 'magic' );
                    sendCalculateRequest();
                }, 1000 );

            } else {
                displayValue = Math.floor( currentVal ).toLocaleString();
                updateDisplay();
            }
        }, 30 );

    } catch ( error ) {
        showError( '❌ 计算错误，请重试！' );
        console.error( error );
        isAnimating = false;
        btnMagic.classList.remove( 'loading' );
        btnMagic.disabled = false;
    }
}

// ========== 发送计算请求 ==========
async function sendCalculateRequest() {
    try {
        const response = await fetch( '/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( {
                a: parseInt( inputValues.a ),
                b: parseInt( inputValues.b ),
                c: inputValues.c || '0',
                mode: currentMode
            } )
        } );

        const result = await response.json();

        if ( result.success ) {
            showResult( result );
            setTimeout( () => {
                launchFireworks();
                showGreeting();
            }, 1500 );
        } else {
            showError( result.message );
        }
    } catch ( error ) {
        showError( '❌ 网络错误，请重试！' );
        console.error( error );
    } finally {
        isAnimating = false;
        btnMagic.classList.remove( 'loading' );
        btnMagic.disabled = false;
    }
}

// ========== 显示结果 ==========
function showResult( result ) {
    resultSection.style.display = 'block';

    resultContent.innerHTML = `
        <div class="result-step">第一步：${parseInt( result.a ).toLocaleString()} + ${parseInt( result.b ).toLocaleString()} = <span style="color: var(--primary-gold)">${sumAB.toLocaleString()}</span></div>
        <div class="result-step">第二步：${targetTime.toLocaleString()} - ${sumAB.toLocaleString()} = <span style="color: var(--primary-gold)">${result.c_real.toLocaleString()}</span></div>
        <div class="result-step">第三步：${sumAB.toLocaleString()} + ${result.c_real.toLocaleString()} = <span style="color: var(--primary-gold); font-size: 20px;">${result.total.toLocaleString()}</span></div>
    `;

    resultHighlight.textContent = `🎯 ${result.time_str}`;

    btnMagic.style.display = 'none';
    resetBtn.style.display = 'flex';

    resultSection.scrollIntoView( { behavior: 'smooth', block: 'center' } );
}

// ========== 重置计算器 ==========
function resetCalculator() {
    currentStep = 1;
    inputValues = { a: '', b: '', c: '' };
    sumAB = 0;
    displayValue = '0';

    updateDisplay();
    updateStepIndicator();
    updateStatus();

    resultSection.style.display = 'none';
    btnMagic.style.display = 'flex';
    btnMagic.disabled = true;
    btnNext.style.display = 'flex';
    btnNext.disabled = true;
    resetBtn.style.display = 'none';

    displayCurrent.classList.remove( 'magic' );
}

// ========== 更新显示 ==========
function updateDisplay() {
    displayCurrent.textContent = formatDisplayValue( displayValue );
}

function formatDisplayValue( value ) {
    return value.replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
}

// ========== 更新步骤指示器 ==========
function updateStepIndicator() {
    stepDots.forEach( ( dot, index ) => {
        const stepNum = index + 1;
        dot.classList.remove( 'active', 'completed' );

        if ( stepNum === currentStep ) {
            dot.classList.add( 'active' );
        } else if ( stepNum < currentStep ) {
            dot.classList.add( 'completed' );
        }
    } );

    stepLines.forEach( ( line, index ) => {
        if ( index + 1 < currentStep ) {
            line.classList.add( 'completed' );
        } else {
            line.classList.remove( 'completed' );
        }
    } );
}

// ========== 更新状态栏 ==========
function updateStatus() {
    statusStep.textContent = `步骤：${currentStep}/3`;
    statusSum.textContent = `和：${sumAB.toLocaleString()}`;
}

// ========== 获取当前步骤的键 ==========
function getCurrentStepKey() {
    return [ 'a', 'b', 'c' ][ currentStep - 1 ];
}

// ========== 键盘支持 ==========
function handleKeyboard( e ) {
    if ( isAnimating ) return;

    if ( e.key >= '0' && e.key <= '9' ) {
        handleNumberInput( e.key );
    } else if ( e.key === 'Enter' ) {
        if ( currentStep < 3 && !btnNext.disabled ) {
            handleNextStep();
        } else if ( currentStep === 3 && !btnMagic.disabled ) {
            performMagic();
        }
    } else if ( e.key === 'Backspace' ) {
        handleDelete();
    } else if ( e.key === 'Escape' || e.key === 'c' || e.key === 'C' ) {
        handleClear();
    }
}

// ========== 显示错误提示 ==========
function showError( message ) {
    const existing = document.querySelector( '.error-toast' );
    if ( existing ) existing.remove();

    const toast = document.createElement( 'div' );
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild( toast );

    setTimeout( () => toast.remove(), 3000 );
}

// ========== 显示成功提示 ==========
function showToast( message ) {
    const existing = document.querySelector( '.error-toast' );
    if ( existing ) existing.remove();

    const toast = document.createElement( 'div' );
    toast.className = 'error-toast';
    toast.style.background = 'rgba(255, 215, 0, 0.9)';
    toast.style.color = '#000';
    toast.textContent = message;
    document.body.appendChild( toast );

    setTimeout( () => toast.remove(), 3000 );
}

// ========== 显示新年祝福 ==========
function showGreeting() {
    greetingOverlay.style.display = 'flex';
}

closeGreeting.addEventListener( 'click', () => {
    greetingOverlay.style.display = 'none';
} );

// ========== 烟花动画 ==========
function initFireworks() {
    const ctx = fireworksCanvas.getContext( '2d' );
    resizeCanvas();

    let particles = [];
    const colors = [ '#c41e3a', '#ffd700', '#ff4d4d', '#00ff00', '#00ffff', '#ff00ff', '#ffffff' ];

    function createFirework( x, y ) {
        const color = colors[ Math.floor( Math.random() * colors.length ) ];
        const particleCount = 80;

        for ( let i = 0; i < particleCount; i++ ) {
            const angle = ( Math.PI * 2 * i ) / particleCount + Math.random() * 0.5;
            const speed = Math.random() * 5 + 2;

            particles.push( {
                x, y,
                vx: Math.cos( angle ) * speed,
                vy: Math.sin( angle ) * speed,
                life: 100,
                color,
                size: Math.random() * 3 + 2,
                gravity: 0.05
            } );
        }
    }

    function update() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect( 0, 0, fireworksCanvas.width, fireworksCanvas.height );

        particles.forEach( ( p, index ) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life--;
            p.size *= 0.98;

            if ( p.life > 0 ) {
                ctx.beginPath();
                ctx.arc( p.x, p.y, p.size, 0, Math.PI * 2 );
                ctx.fillStyle = p.color;
                ctx.fill();
            } else {
                particles.splice( index, 1 );
            }
        } );

        requestAnimationFrame( update );
    }

    function autoLaunch() {
        if ( Math.random() < 0.03 ) {
            createFirework(
                Math.random() * fireworksCanvas.width,
                Math.random() * fireworksCanvas.height * 0.5
            );
        }
        setTimeout( autoLaunch, 100 );
    }

    update();
    autoLaunch();
}

function resizeCanvas() {
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
}

function launchFireworks() {
    const colors = [ '#c41e3a', '#ffd700', '#ff4d4d', '#00ff00', '#00ffff', '#ff00ff', '#ffffff' ];
    const ctx = fireworksCanvas.getContext( '2d' );

    for ( let i = 0; i < 20; i++ ) {
        setTimeout( () => {
            const x = Math.random() * fireworksCanvas.width;
            const y = Math.random() * fireworksCanvas.height * 0.4 + 50;
            const color = colors[ Math.floor( Math.random() * colors.length ) ];

            for ( let j = 0; j < 100; j++ ) {
                const angle = ( Math.PI * 2 * j ) / 100 + Math.random() * 0.5;
                const speed = Math.random() * 6 + 3;

                ctx.beginPath();
                ctx.arc( x, y, Math.random() * 3 + 2, 0, Math.PI * 2 );
                ctx.fillStyle = color;
                ctx.fill();
            }
        }, i * 150 );
    }
}

window.addEventListener( 'resize', resizeCanvas );