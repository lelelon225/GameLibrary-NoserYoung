type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertOptions {
  message: string;
  type: AlertType;
  duration?: number;
}

class AlertManager {
  private alertElement: HTMLElement | null;
  private alertText: HTMLElement | null;
  private alertIcon: HTMLElement | null;
  private currentTimeout: number | null = null;

  constructor() {
    this.alertElement = document.getElementById('alert');
    this.alertText = this.alertElement?.querySelector('.alert-text') as HTMLElement;
    this.alertIcon = this.alertElement?.querySelector('.alert-icon') as HTMLElement;
    
    if (this.alertElement && !this.alertIcon) {
      this.alertIcon = document.createElement('div');
      this.alertIcon.className = 'alert-icon';
      this.alertElement.insertBefore(this.alertIcon, this.alertText);
    }
  }

  show(options: AlertOptions): void {
    if (!this.alertElement || !this.alertText || !this.alertIcon) {
      console.error('Alert elements not found');
      return;
    }

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    this.alertElement.classList.remove('alert-success', 'alert-error', 'alert-warning', 'alert-info');

    this.alertElement.classList.add(`alert-${options.type}`);

    this.alertText.textContent = options.message;

    this.alertIcon.innerHTML = this.getIconSVG(options.type);

    this.alertElement.classList.add('show');

    const duration = options.duration ?? 3000;
    if (duration > 0) {
      this.currentTimeout = window.setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  hide(): void {
    if (this.alertElement) {
      this.alertElement.classList.remove('show');
    }
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  success(message: string, duration: number): void {
    this.show({ message, type: 'success', duration });
  }

  error(message: string, duration: number): void {
    this.show({ message, type: 'error', duration });
  }

  warning(message: string, duration: number): void {
    this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration: number): void {
    this.show({ message, type: 'info', duration });
  }

  private getIconSVG(type: AlertType): string {
    switch (type) {
      case 'success':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        `;
      case 'error':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        `;
      case 'warning':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        `;
      case 'info':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        `;
    }
  }
}

export const alert = new AlertManager();
