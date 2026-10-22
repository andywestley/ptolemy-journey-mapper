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

<main id="main-content" class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
            <h1 class="h3 fw-bold mb-1">Templates & Starter Blueprints</h1>
            <p class="text-muted small mb-0">Start journey mapping with pre-configured OpenJourney blueprints.</p>
        </div>
        <a href="/dashboard/" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-arrow-left me-1"></i> Back to My Journeys
        </a>
    </div>

    <div class="mb-3">
        <h2 class="h4 fw-bold mb-1"><i class="bi bi-grid-fill text-primary me-2"></i>Core Journey Templates</h2>
        <p class="text-muted small mb-0">Explore foundational blueprints for discovery, procurement, and customer service.</p>
    </div>

    <div class="row g-4">
        <!-- Tutorial -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 border-primary bg-light shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="card-title h5 fw-bold text-primary">Self-Guided Tutorial</h3>
                        <i class="bi bi-mortarboard fs-3 text-primary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">Learn to use Ptolemy with an interactive walkthrough. Recommended for new users.</p>
                    <button class="btn btn-primary w-100" onclick="importTemplate('/samples/self-guided-tutorial.ojf')" aria-label="Use Self-Guided Tutorial template">
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
                        <h3 class="card-title h5 fw-bold">B2B Software Purchase</h3>
                        <i class="bi bi-buildings fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">An enterprise procurement journey. It covers stakeholder reviews, security checks, and vendor contacts.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/b2b-software-purchase.ojf')" aria-label="Use B2B Software Purchase template">
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
                        <h3 class="card-title h5 fw-bold">E-commerce Return</h3>
                        <i class="bi bi-box-seam fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">An unhappy return flow for a damaged item. Shows low emotion scores and friction points.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/ecommerce-return.ojf')" aria-label="Use E-commerce Return template">
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
                        <h3 class="card-title h5 fw-bold">E-commerce Purchase</h3>
                        <i class="bi bi-cart-check fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A smooth retail purchase journey. Tracks steps from discovery to product onboarding.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/ecommerce-purchase.ojf')" aria-label="Use E-commerce Purchase template">
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
                        <h3 class="card-title h5 fw-bold">Customer Support</h3>
                        <i class="bi bi-headset fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A service journey for technical support. Follows a customer resolving a hardware problem.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/customer-support.ojf')" aria-label="Use Customer Support template">
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
                        <h3 class="card-title h5 fw-bold">Event Booking</h3>
                        <i class="bi bi-calendar-event fs-3 text-secondary"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">Plan and book an international conference. Covers registration and travel logistics.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/event-booking.ojf')" aria-label="Use Event Booking template">
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
                        <h3 class="card-title h5 fw-bold text-info">Hotel Check-in Blueprint</h3>
                        <i class="bi bi-diagram-3 fs-3 text-info"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A service blueprint for hotel arrival. Shows visible actions, backstage tasks, and physical evidence.</p>
                    <button class="btn btn-info text-white w-100" onclick="importTemplate('/samples/hotel-check-in-blueprint.ojf')" aria-label="Use Hotel Check-in Blueprint template">
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
                        <h3 class="card-title h5 fw-bold text-success">Clinic Visit Blueprint</h3>
                        <i class="bi bi-hospital fs-3 text-success"></i>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A clinical service blueprint. Details patient triage, medical records, and digital support systems.</p>
                    <button class="btn btn-success text-white w-100" onclick="importTemplate('/samples/clinic-visit-blueprint.ojf')" aria-label="Use Clinic Visit Blueprint template">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- UK Public Services & Everyday Journeys Section -->
    <div class="d-flex justify-content-between align-items-center mt-5 mb-4 flex-wrap gap-2">
        <div>
            <h2 class="h4 fw-bold mb-1">
                <i class="bi bi-geo-alt-fill text-danger me-2"></i>UK Public Services & Life Events
            </h2>
            <p class="text-muted small mb-0">Real British public service journeys. Covers key touchpoints across the NHS, DVLA, HMRC, and rail.</p>
        </div>
    </div>

    <div class="row g-4">
        <!-- NHS GP & Pharmacy First -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="card-title h5 fw-bold">NHS GP & Pharmacy First</h3>
                        <span class="badge bg-primary text-white">NHS</span>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">Access NHS primary care. Includes the 8am phone queue, NHS App triage, and Pharmacy First prescriptions.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/nhs-gp-appointment.ojf')" aria-label="Use NHS GP & Pharmacy First template">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- UK First-Time Home Buyer -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="card-title h5 fw-bold">First-Time Home Buyer (UK)</h3>
                        <span class="badge bg-success text-white">Property</span>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">Buy a first home in the UK. Covers savings, mortgages, property surveys, and legal completion.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/uk-first-time-buyer.ojf')" aria-label="Use First-Time Home Buyer (UK) template">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- DVLA Driving Licence Renewal -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="card-title h5 fw-bold">DVLA Licence Renewal</h3>
                        <span class="badge bg-dark text-white">GOV.UK</span>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">Renew a UK driving licence online. Follows the D798 reminder, GOV.UK form, and postal delivery.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/dvla-driving-licence-renewal.ojf')" aria-label="Use DVLA Licence Renewal template">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- UK Commuter Train & Delay Repay -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="card-title h5 fw-bold">Train Commute & Delay Repay</h3>
                        <span class="badge bg-warning text-dark">Transport</span>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">A disrupted rail commute. Follows signalling delays, missed meetings, and a Delay Repay claim.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/uk-train-delay-repay.ojf')" aria-label="Use Train Commute & Delay Repay template">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>

        <!-- HMRC Self Assessment Tax Return -->
        <div class="col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="card-title h5 fw-bold">HMRC Self Assessment Return</h3>
                        <span class="badge bg-info text-dark">HMRC</span>
                    </div>
                    <p class="card-text text-muted small mb-4 flex-grow-1">File an annual self-assessment tax return. Covers Government Gateway login, expenses, and tax payments.</p>
                    <button class="btn btn-outline-primary w-100" onclick="importTemplate('/samples/hmrc-self-assessment.ojf')" aria-label="Use HMRC Self Assessment Return template">
                        <i class="bi bi-plus-circle me-1"></i> Use Template
                    </button>
                </div>
            </div>
        </div>
    </div>
</main>

<?php
$extraJs = ["auth.js", "utils.js", "templates.js"];
include __DIR__ . '/includes/footer.php';
?>

