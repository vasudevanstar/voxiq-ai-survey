/**
 * Branding & White-Label Service
 * Manages custom branding configurations
 */

import { BrandingConfig } from '../types/survey';

export class BrandingService {
  private static readonly STORAGE_KEY = 'survey_sense_branding';

  /**
   * Gets active branding configuration
   */
  static getActiveBranding(): BrandingConfig | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultBranding();
    } catch {
      return this.getDefaultBranding();
    }
  }

  /**
   * Gets default branding
   */
  static getDefaultBranding(): BrandingConfig {
    return {
      id: 'default',
      name: 'Survey Sense Default',
      primaryColor: '#00d9ff',
      secondaryColor: '#ff006e',
      accentColor: '#00f5ff',
      companyName: 'Survey Sense',
      companyWebsite: 'https://surveysense.ai',
      footerText: '© Survey Sense | AI-Powered Decision Intelligence',
      isActive: true,
    };
  }

  /**
   * Saves branding configuration
   */
  static saveBranding(branding: BrandingConfig): boolean {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(branding));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Applies branding to DOM
   */
  static applyBranding(branding: BrandingConfig): void {
    const root = document.documentElement;
    
    // Set CSS variables for colors
    root.style.setProperty('--brand-primary', branding.primaryColor);
    root.style.setProperty('--brand-secondary', branding.secondaryColor);
    root.style.setProperty('--brand-accent', branding.accentColor);

    // Apply favicon if provided
    if (branding.favicon) {
      this.setFavicon(branding.favicon);
    }

    // Apply logo if provided
    if (branding.logo) {
      const logoElements = document.querySelectorAll('[data-branding-logo]');
      logoElements.forEach(el => {
        (el as HTMLImageElement).src = branding.logo!;
      });
    }

    // Update page title
    if (branding.companyName) {
      document.title = `${branding.companyName} | Survey Platform`;
    }

    // Inject custom CSS
    if (branding.customCSS) {
      this.injectCustomCSS(branding.customCSS);
    }
  }

  /**
   * Sets favicon
   */
  private static setFavicon(url: string): void {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  /**
   * Injects custom CSS
   */
  private static injectCustomCSS(css: string): void {
    const styleId = 'branding-custom-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    
    style.textContent = css;
  }

  /**
   * Generates CSS variables for branding
   */
  static generateCSSVariables(branding: BrandingConfig): string {
    return `
      :root {
        --brand-primary: ${branding.primaryColor};
        --brand-secondary: ${branding.secondaryColor};
        --brand-accent: ${branding.accentColor};
      }

      .brand-primary { color: ${branding.primaryColor}; }
      .brand-secondary { color: ${branding.secondaryColor}; }
      .brand-accent { color: ${branding.accentColor}; }
      
      .bg-brand-primary { background-color: ${branding.primaryColor}; }
      .bg-brand-secondary { background-color: ${branding.secondaryColor}; }
      .bg-brand-accent { background-color: ${branding.accentColor}; }
      
      .border-brand-primary { border-color: ${branding.primaryColor}; }
      .border-brand-secondary { border-color: ${branding.secondaryColor}; }
      .border-brand-accent { border-color: ${branding.accentColor}; }
    `;
  }

  /**
   * Gets all branded elements
   */
  static getAllBrandedElements(): {
    logo: HTMLElement | null;
    favicon: HTMLElement | null;
    primaryElements: NodeListOf<Element>;
    secondaryElements: NodeListOf<Element>;
  } {
    return {
      logo: document.querySelector('[data-branding-logo]'),
      favicon: document.querySelector("link[rel~='icon']"),
      primaryElements: document.querySelectorAll('[class*="brand-primary"]'),
      secondaryElements: document.querySelectorAll('[class*="brand-secondary"]'),
    };
  }

  /**
   * Validates branding config
   */
  static validateBranding(branding: Partial<BrandingConfig>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!branding.primaryColor || !/^#[0-9A-F]{6}$/i.test(branding.primaryColor)) {
      errors.push('Primary color must be a valid hex color');
    }

    if (!branding.secondaryColor || !/^#[0-9A-F]{6}$/i.test(branding.secondaryColor)) {
      errors.push('Secondary color must be a valid hex color');
    }

    if (!branding.companyName || branding.companyName.trim().length === 0) {
      errors.push('Company name is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Exports branding configuration as JSON
   */
  static exportBranding(branding: BrandingConfig): string {
    return JSON.stringify(branding, null, 2);
  }

  /**
   * Imports branding configuration from JSON
   */
  static importBranding(jsonString: string): BrandingConfig | null {
    try {
      const branding = JSON.parse(jsonString) as BrandingConfig;
      const validation = this.validateBranding(branding);
      
      if (!validation.valid) {
        console.error('Invalid branding configuration:', validation.errors);
        return null;
      }

      return branding;
    } catch (error) {
      console.error('Failed to import branding:', error);
      return null;
    }
  }
}
