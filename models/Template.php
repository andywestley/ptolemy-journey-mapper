<?php
/**
 * Template Model for Ptolemy
 */
class Template {
    /**
     * Get directory path for starter samples.
     */
    public static function getSamplesDirectory(): string {
        return dirname(__DIR__) . '/public/samples';
    }

    /**
     * Retrieve all starter template definitions and file metadata.
     *
     * @return array List of templates with file, name, path, and lastmod
     */
    public static function getAll(): array {
        $samplesDir = self::getSamplesDirectory();
        if (!is_dir($samplesDir)) {
            return [];
        }

        $files = glob($samplesDir . '/*.ojf');
        if (!$files) {
            return [];
        }

        $templates = [];
        foreach ($files as $filePath) {
            $filename = basename($filePath);
            $slug = basename($filePath, '.ojf');
            $name = ucwords(str_replace('-', ' ', $slug));
            $lastmod = date('Y-m-d', filemtime($filePath));

            $templates[] = [
                'filename' => $filename,
                'slug' => $slug,
                'name' => $name,
                'path' => '/samples/' . $filename,
                'lastmod' => $lastmod
            ];
        }

        return $templates;
    }
}
