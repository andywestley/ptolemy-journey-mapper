<?php
/**
 * Journey Model for Ptolemy
 */
require_once __DIR__ . '/../config/db_connect.php';

class Journey {
    /**
     * Find a single journey by ID.
     */
    public static function findById(string $id): ?array {
        $db = getDBConnection();
        $stmt = $db->prepare("SELECT * FROM journeys WHERE id = ?");
        $stmt->execute([$id]);
        $journey = $stmt->fetch();
        return $journey ?: null;
    }

    /**
     * Retrieve all active public journeys for standard sitemap and public index.
     */
    public static function findPublic(): array {
        $db = getDBConnection(false);
        if (!$db) {
            return [];
        }
        $stmt = $db->query("
            SELECT id, title, description, owner_id, folder, journey_status, is_public, created_at, updated_at 
            FROM journeys 
            WHERE (is_public = 1 OR is_public = '1') 
              AND (journey_status IS NULL OR journey_status != 'trash') 
            ORDER BY updated_at DESC
        ");
        return $stmt->fetchAll() ?: [];
    }

    /**
     * Retrieve all active journeys (both public and private) for authorised audit crawlers.
     */
    public static function findAllForAudit(): array {
        $db = getDBConnection(false);
        if (!$db) {
            return [];
        }
        $stmt = $db->query("
            SELECT id, title, description, owner_id, folder, journey_status, is_public, created_at, updated_at 
            FROM journeys 
            WHERE (journey_status IS NULL OR journey_status != 'trash') 
            ORDER BY updated_at DESC
        ");
        return $stmt->fetchAll() ?: [];
    }

    /**
     * Check if a specific user is a registered collaborator on a journey.
     */
    public static function isCollaborator(string $journeyId, string $userId): bool {
        $db = getDBConnection();
        $stmt = $db->prepare("SELECT 1 FROM journey_collaborators WHERE journey_id = ? AND user_id = ?");
        $stmt->execute([$journeyId, $userId]);
        return (bool)$stmt->fetch();
    }

    /**
     * Check if a user has access to view or edit a journey.
     *
     * @param array|string $journey Either journey array or journey ID
     * @param string|null $userId User ID to check (null if anonymous)
     * @param bool $requireEdit If true, only owner or collaborators have access
     */
    public static function hasAccess($journey, ?string $userId, bool $requireEdit = false): bool {
        if (is_string($journey)) {
            $journey = self::findById($journey);
        }
        if (!$journey || ($journey['journey_status'] ?? '') === 'trash') {
            return false;
        }

        if ($userId) {
            if ((string)$journey['owner_id'] === (string)$userId) {
                return true;
            }
            if (self::isCollaborator($journey['id'], $userId)) {
                return true;
            }
        }

        // If edit access is not required, public journeys are accessible to anyone
        if (!$requireEdit && !empty($journey['is_public'])) {
            return true;
        }

        return false;
    }

    /**
     * Retrieve list of collaborators for a journey.
     */
    public static function getCollaborators(string $journeyId): array {
        $db = getDBConnection();
        $stmt = $db->prepare("
            SELECT u.id, u.name, u.email, u.avatar 
            FROM users u
            INNER JOIN journey_collaborators jc ON u.id = jc.user_id
            WHERE jc.journey_id = ?
            ORDER BY u.name ASC
        ");
        $stmt->execute([$journeyId]);
        return $stmt->fetchAll() ?: [];
    }
}
