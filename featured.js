// featured.js - Quản lý các tính năng mở rộng (Win/Loss Streak)

// Cấu hình thưởng vàng
const STREAK_BONUS = {
    2: 1, // Chuỗi 2-3: +1 vàng
    4: 2, // Chuỗi 4: +2 vàng
    5: 3  // Chuỗi 5+: +3 vàng
};

export class StreakManager {
    constructor() {
        this.winStreak = 0;
        this.lossStreak = 0;
    }

    // Gọi hàm này khi kết thúc round
    // isWin: true (Thắng), false (Thua), null (Hòa/Draw)
    updateState(isWin) {
        if (isWin === true) {
            this.winStreak++;
            this.lossStreak = 0;
        } else if (isWin === false) {
            this.lossStreak++;
            this.winStreak = 0;
        } else {
            // Trường hợp hòa (hết giờ), reset cả 2 theo luật TFT chuẩn hoặc giữ nguyên
            // Ở đây ta reset để tránh exploit
            this.winStreak = 0;
            this.lossStreak = 0;
        }
    }

    // Lấy số vàng thưởng dựa trên chuỗi hiện tại
    getBonusGold() {
        const streak = Math.max(this.winStreak, this.lossStreak);
        if (streak >= 5) return STREAK_BONUS[5];
        if (streak >= 4) return STREAK_BONUS[4];
        if (streak >= 2) return STREAK_BONUS[2];
        return 0;
    }

    // Hiển thị UI
    render() {
        const container = document.getElementById('streak-display');
        if (!container) return;

        let icon = '';
        let count = 0;
        let color = '#777';
        let bonus = this.getBonusGold();

        if (this.winStreak > 1) {
            icon = '🔥'; // Icon lửa cho chuỗi thắng
            count = this.winStreak;
            color = '#e74c3c'; // Màu đỏ cam
        } else if (this.lossStreak > 1) {
            icon = '❄️'; // Icon băng/tuyết cho chuỗi thua
            count = this.lossStreak;
            color = '#3498db'; // Màu xanh dương
        }

        if (count > 0) {
            container.innerHTML = `
                <div style="color:${color}; font-weight:bold; display:flex; align-items:center; gap:4px; font-size:0.8rem; text-shadow:1px 1px 0 #000;">
                    <span>${icon}</span>
                    <span>${count}</span>
                    <span style="font-size:0.7rem; color:#ffd700; margin-left:2px;">(+${bonus})</span>
                </div>
            `;
            container.classList.remove('hidden');
        } else {
            container.innerHTML = '';
            container.classList.add('hidden');
        }
    }
    
    reset() {
        this.winStreak = 0;
        this.lossStreak = 0;
    }
}
