// Progress Bar
window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = document.getElementById('progress');
  if (progress) {
    progress.style.width = (window.scrollY / h * 100) + '%';
  }
});

// Mobile Menu
function toggleMenu() {
  const menu = document.getElementById('mobile-menu') || document.querySelector('.mobile-menu');
  if (menu) {
    menu.classList.toggle('open');
  }
}

// Same-page section jumps without changing the URL hash (static site / SEO)
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-inpage-scroll]');
  if (!link) return;
  const id = link.getAttribute('data-inpage-scroll');
  if (!id) return;
  const target = document.getElementById(id);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Nav toggle button (refactored pages)
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', toggleMenu);
  }
  
  // Close mobile menu when links are clicked
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu ul li a');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      const menu = document.querySelector('.mobile-menu');
      if (menu) {
        menu.classList.remove('open');
      }
    });
  });
});

// Reveal on Scroll (Intersection Observer)
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -60px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => observer.observe(el));
  
  // Add Toast element if not present
  if (!document.getElementById('toast')) {
    const toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
});

// Book Package Helper (Copy to Clipboard & Redirect)
function bookPackage(setName) {
  const message = `Hi! I would like to book ${setName} for my event.`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(message).then(() => {
    showToast(`"Message copied! Opening Messenger..."`);
    
    // Redirect after a short delay
    setTimeout(() => {
      window.open('https://m.me/EasyRental.ngani', '_blank');
    }, 1200);
  }).catch(err => {
    // Fallback if clipboard fails
    window.open(`https://m.me/EasyRental.ngani?text=${encodeURIComponent(message)}`, '_blank');
  });
}

function showToast(text) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.innerText = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.setAttribute('readonly', '');
    tempInput.style.position = 'absolute';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      resolve();
    } catch (error) {
      document.body.removeChild(tempInput);
      reject(error);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const copyButtons = document.querySelectorAll('[data-copy-target]');

  copyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-copy-target');
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      copyTextToClipboard(target.innerText.trim())
        .then(() => {
          showToast('Inquiry format copied. Paste it into Messenger.');
        })
        .catch(() => {
          showToast('Could not copy automatically. You can still copy the message manually.');
        });
    });
  });
});
