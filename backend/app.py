from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os

# 获取项目根目录（backend 的上一级）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 配置模板和静态文件路径
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, 'frontend', 'templates'),
    static_folder=os.path.join(BASE_DIR, 'static')
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/get_target_time', methods=['POST'])
def get_target_time():
    """获取目标时间数字"""
    data = request.json
    mode = data.get('mode', 2)
    
    if mode == 1:
        now = datetime.now()
        m, d, h, mm = now.month, now.day, now.hour, now.minute
    else:
        m, d, h, mm = 2, 16, 22, 27
    
    target = int(f"{m}{d}{h:02d}{mm:02d}")
    
    return jsonify({
        'success': True,
        'target': target,
        'mode': mode,
        'time_str': f"{m}月{d}日 {h:02d}:{mm:02d}"
    })

@app.route('/api/calculate', methods=['POST'])
def calculate():
    """魔术计算核心"""
    data = request.json
    
    try:
        val_a = int(data.get('a', 0))
        val_b = int(data.get('b', 0))
        val_c_user = data.get('c', '0')
        mode = int(data.get('mode', 2))
        
        if mode == 1:
            now = datetime.now()
            m, d, h, mm = now.month, now.day, now.hour, now.minute
        else:
            m, d, h, mm = 2, 16, 22, 27
        
        target = int(f"{m}{d}{h:02d}{mm:02d}")
        time_str = f"{m}月{d}日 {h:02d}:{mm:02d}"
        
        if val_a + val_b >= target:
            return jsonify({
                'success': False,
                'message': '⚠️ 前两个数字的和太大了！请重新输入较小的数字，确保和小于目标时间数字。'
            })
        
        forced_c = target - (val_a + val_b)
        
        return jsonify({
            'success': True,
            'target': target,
            'time_str': time_str,
            'a': val_a,
            'b': val_b,
            'c_real': forced_c,
            'c_user': val_c_user,
            'total': val_a + val_b + forced_c,
            'message': f'🎉 奇迹发生！无论您输入什么，结果都是 {time_str} 对应的数字！'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ 计算错误：{str(e)}'
        })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)