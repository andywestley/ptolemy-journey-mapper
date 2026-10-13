<?php
/**
 * Standalone Templates and Blueprints Gallery for Ptolemy
 *
 * Distinct URL: /templates/
 */

require_once __DIR__ . '/includes/auth_guard.php';
$currentUser = requireAuth();

$pageTitle = "Templates & Blueprints | Ptolemy";
$pageDescription = "Start your customer journey map with pre-configured templates and service blueprints.";
$extraCss = ["dashboard.css"];
include __DIR__ . '/includes/header.php';
?>

<!-- Loading Overlay -->
<div id="loading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status"></div>
</div>

<?php 
$activeNav = 'templates';
include __DIR__ . '/includes/navbar.php'; 
?>

<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
            <h1 class="h3 fw-bold mb-1">Templates & Starter Blueprints</h1>
            <p class="text-muted small mb-0">Jumpstart your journey mapping with pre-configured OpenJourney blueprints.</p>
        </div>
        <a href="/dashboard/" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-arrow-left me-1"></i> Back to My Journeys
        </a>
    </div>

    <div class="row g-4">
        <!-- Tutorial -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 border-primary bg-light shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold text-primary">Self-Guided Tutorial</h5>
                        <i class="bi bi-mortarboard fs-3 text-primary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">Learn how to use Ptolemy interactively by exploring a map that explains how to build a map. Highly recommended for first-time users.</p>
                    <button class="btn btn-primary w-100" onclick="importTemplate('/samples/self-guided-tutorial.ojf')">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- B2B Software Purchase -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold">B2B Software Purchase</h5>
                        <i class="bi bi-buildings fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A complex enterprise procurement journey involving multiple stakeholders, security reviews, and vendor touchpoints.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/b2b-software-purchase.ojf')">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- E-commerce Return -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold">E-commerce Return</h5>
                        <i class="bi bi-box-seam fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A negative friction flow demonstrating how an unhappy path (returning a broken item) is tracked with low Emotion scores and pain point tags.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/ecommerce-return.ojf')">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- E-commerce Purchase -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold">E-commerce Purchase</h5>
                        <i class="bi bi-cart-check fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A happy-path flow for a high-end product purchase, from initial discovery to onboarding.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/ecommerce-purchase.ojf')">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- Customer Support -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold">Customer Support</h5>
                        <i class="bi bi-headset fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A service-focused journey documenting a support interaction for a technical hardware issue.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/customer-support.ojf')">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- Event Booking -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold">Event Booking</h5>
                        <i class="bi bi-calendar-event fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">Tracking travel logistics and registration for an international conference.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/event-booking.ojf')">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- Hotel Blueprint -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 border-info bg-light shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold text-info">Hotel Check-in Blueprint</h5>
                        <i class="bi bi-diagram-3 fs-3 text-info"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A multi-layered service blueprint demonstrating Frontstage/Backstage actions and Physical Evidence for a luxury hotel arrival.</p>
                    <button class="btn btn-info text-white w-100" onclick="importTemplate('/samples/hotel-check-in-blueprint.ojf')">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- Clinic Blueprint -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 border-success bg-light shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold text-success">Clinic Visit Blueprint</h5>
                        <i class="bi bi-hospital fs-3 text-success"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A healthcare service blueprint focusing on clinical triage, backstage record management, and EMR support systems.</p>
                    <button class="btn btn-success text-white w-100" onclick="importTemplate('/samples/clinic-visit-blueprint.ojf')">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
$extraJs = ["auth.js", "utils.js", "editor.js"];
include __DIR__ . '/includes/footer.php';
?>
