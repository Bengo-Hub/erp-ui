import { ref, computed } from 'vue';

/**
 * Mobile Service
 * Handles mobile-specific optimizations, responsive behavior, and device detection
 */
class MobileService {
  constructor() {
    this.isMobile = ref(false);
    this.isTablet = ref(false);
    this.isDesktop = ref(false);
    this.screenSize = ref('desktop');
    this.orientation = ref('portrait');
    this.touchCapable = ref(false);
    this.devicePixelRatio = ref(1);
    
    this.init();
  }

  init() {
    this.updateDeviceInfo();
    this.setupEventListeners();
  }

  updateDeviceInfo() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update screen size classification
    if (width < 768) {
      this.screenSize.value = 'mobile';
      this.isMobile.value = true;
      this.isTablet.value = false;
      this.isDesktop.value = false;
    } else if (width >= 768 && width < 1024) {
      this.screenSize.value = 'tablet';
      this.isMobile.value = false;
      this.isTablet.value = true;
      this.isDesktop.value = false;
    } else {
      this.screenSize.value = 'desktop';
      this.isMobile.value = false;
      this.isTablet.value = false;
      this.isDesktop.value = true;
    }
    
    // Update orientation
    this.orientation.value = width > height ? 'landscape' : 'portrait';
    
    // Update device capabilities
    this.touchCapable.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.devicePixelRatio.value = window.devicePixelRatio || 1;
  }

  setupEventListeners() {
    // Handle resize events
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle orientation change
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Handle visibility change (for performance optimization)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  handleResize() {
    this.updateDeviceInfo();
    this.optimizeForScreenSize();
  }

  handleOrientationChange() {
    // Wait for the orientation change to complete
    setTimeout(() => {
      this.updateDeviceInfo();
      this.optimizeForScreenSize();
    }, 100);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, pause heavy operations
      this.pauseHeavyOperations();
    } else {
      // Page is visible, resume operations
      this.resumeHeavyOperations();
    }
  }

  optimizeForScreenSize() {
    // Apply mobile-specific optimizations
    if (this.isMobile.value) {
      this.applyMobileOptimizations();
    } else if (this.isTablet.value) {
      this.applyTabletOptimizations();
    } else {
      this.applyDesktopOptimizations();
    }
  }

  applyMobileOptimizations() {
    // Reduce animations for better performance
    document.documentElement.style.setProperty('--animation-duration', '0.2s');
    
    // Optimize touch targets
    this.optimizeTouchTargets();
    
    // Reduce image quality for faster loading
    this.optimizeImages();
    
    // Enable mobile-specific features
    this.enableMobileFeatures();
  }

  applyTabletOptimizations() {
    // Medium animation duration
    document.documentElement.style.setProperty('--animation-duration', '0.3s');
    
    // Optimize for touch and mouse
    this.optimizeTouchTargets();
    
    // Enable tablet-specific features
    this.enableTabletFeatures();
  }

  applyDesktopOptimizations() {
    // Full animation duration
    document.documentElement.style.setProperty('--animation-duration', '0.4s');
    
    // Enable desktop-specific features
    this.enableDesktopFeatures();
  }

  optimizeTouchTargets() {
    // Ensure minimum touch target size (44px)
    const touchTargets = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    touchTargets.forEach(target => {
      const rect = target.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        target.style.minHeight = '44px';
        target.style.minWidth = '44px';
      }
    });
  }

  optimizeImages() {
    // Lazy load images on mobile
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    }
  }

  enableMobileFeatures() {
    // Enable pull-to-refresh
    this.enablePullToRefresh();
    
    // Enable swipe gestures
    this.enableSwipeGestures();
    
    // Optimize scrolling
    this.optimizeScrolling();
  }

  enableTabletFeatures() {
    // Enable multi-touch gestures
    this.enableMultiTouchGestures();
    
    // Optimize for split-screen
    this.optimizeForSplitScreen();
  }

  enableDesktopFeatures() {
    // Enable keyboard shortcuts
    this.enableKeyboardShortcuts();
    
    // Enable hover effects
    this.enableHoverEffects();
  }

  enablePullToRefresh() {
    // Implementation for pull-to-refresh functionality
    let startY = 0;
    let currentY = 0;
    let pullDistance = 0;
    
    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
      pullDistance = currentY - startY;
      
      if (pullDistance > 0 && window.scrollY === 0) {
        e.preventDefault();
        // Show pull-to-refresh indicator
        this.showPullToRefreshIndicator(pullDistance);
      }
    });
    
    document.addEventListener('touchend', () => {
      if (pullDistance > 100) {
        // Trigger refresh
        this.triggerRefresh();
      }
      this.hidePullToRefreshIndicator();
      pullDistance = 0;
    });
  }

  enableSwipeGestures() {
    // Implementation for swipe gestures
    let startX = 0;
    let startY = 0;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) {
          this.handleSwipeRight();
        } else if (deltaX < -50) {
          this.handleSwipeLeft();
        }
      } else {
        if (deltaY > 50) {
          this.handleSwipeDown();
        } else if (deltaY < -50) {
          this.handleSwipeUp();
        }
      }
    });
  }

  enableMultiTouchGestures() {
    // Implementation for multi-touch gestures (pinch, zoom, etc.)
    let initialDistance = 0;
    
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    });
    
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        
        // Handle pinch zoom
        this.handlePinchZoom(scale);
      }
    });
  }

  optimizeScrolling() {
    // Enable smooth scrolling on mobile
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Optimize scroll performance
    let ticking = false;
    
    const updateScroll = () => {
      // Update scroll-based animations
      this.updateScrollAnimations();
      ticking = false;
    };
    
    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', requestTick);
  }

  optimizeForSplitScreen() {
    // Adjust layout for split-screen mode on tablets
    const mediaQuery = window.matchMedia('(max-width: 1024px) and (orientation: landscape)');
    
    if (mediaQuery.matches) {
      document.body.classList.add('split-screen-mode');
    }
  }

  enableKeyboardShortcuts() {
    // Implementation for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.handleSaveShortcut();
      }
      
      // Ctrl/Cmd + N for new
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.handleNewShortcut();
      }
    });
  }

  enableHoverEffects() {
    // Enable hover effects only on desktop
    document.body.classList.add('hover-enabled');
  }

  // Utility methods
  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  showPullToRefreshIndicator(distance) {
    // Show pull-to-refresh indicator
    const indicator = document.getElementById('pull-to-refresh-indicator');
    if (indicator) {
      indicator.style.transform = `translateY(${Math.min(distance, 100)}px)`;
      indicator.style.opacity = Math.min(distance / 100, 1);
    }
  }

  hidePullToRefreshIndicator() {
    const indicator = document.getElementById('pull-to-refresh-indicator');
    if (indicator) {
      indicator.style.transform = 'translateY(-100px)';
      indicator.style.opacity = 0;
    }
  }

  triggerRefresh() {
    // Trigger page refresh or data reload
    window.location.reload();
  }

  handleSwipeRight() {
    // Handle right swipe (e.g., open sidebar)
    console.log('Swipe right detected');
  }

  handleSwipeLeft() {
    // Handle left swipe (e.g., close sidebar)
    console.log('Swipe left detected');
  }

  handleSwipeUp() {
    // Handle up swipe
    console.log('Swipe up detected');
  }

  handleSwipeDown() {
    // Handle down swipe
    console.log('Swipe down detected');
  }

  handlePinchZoom(scale) {
    // Handle pinch zoom
    console.log('Pinch zoom scale:', scale);
  }

  updateScrollAnimations() {
    // Update scroll-based animations
    const scrollElements = document.querySelectorAll('[data-scroll-animation]');
    scrollElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isVisible) {
        element.classList.add('animate-in');
      }
    });
  }

  handleSaveShortcut() {
    // Handle save shortcut
    console.log('Save shortcut triggered');
  }

  handleNewShortcut() {
    // Handle new shortcut
    console.log('New shortcut triggered');
  }

  pauseHeavyOperations() {
    // Pause heavy operations when page is hidden
    console.log('Pausing heavy operations');
  }

  resumeHeavyOperations() {
    // Resume heavy operations when page is visible
    console.log('Resuming heavy operations');
  }

  // Public API
  getDeviceInfo() {
    return {
      isMobile: this.isMobile.value,
      isTablet: this.isTablet.value,
      isDesktop: this.isDesktop.value,
      screenSize: this.screenSize.value,
      orientation: this.orientation.value,
      touchCapable: this.touchCapable.value,
      devicePixelRatio: this.devicePixelRatio.value
    };
  }

  isTouchDevice() {
    return this.touchCapable.value;
  }

  getOptimalImageSize() {
    if (this.isMobile.value) {
      return 'small';
    } else if (this.isTablet.value) {
      return 'medium';
    } else {
      return 'large';
    }
  }

  shouldUseMobileLayout() {
    return this.isMobile.value || (this.isTablet.value && this.orientation.value === 'portrait');
  }

  // Cleanup
  destroy() {
    window.removeEventListener('resize', this.handleResize.bind(this));
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
}

// Create singleton instance
const mobileService = new MobileService();

export default mobileService;
