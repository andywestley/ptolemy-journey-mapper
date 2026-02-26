# OpenJourney Format (.ojf) Specification

The `.ojf` format is a JSON-based schema designed for representing user journey maps in a structured, data-driven way. It is used by the Ptolemy editor as the primary state and export format.

## Root Object

| Element | Type | Description |
| :--- | :--- | :--- |
| `version` | String | The version of the OJF specification (e.g., "1.0"). |
| `persona` | String | (Optional) The user archetype or archetype group being mapped (e.g., "Frequent Traveler"). |
| `pointOfView`| String | (Optional) The specific perspective or scenario (e.g., "Booking a flight via mobile"). |
| `stages` | Array | A list of Stage objects representing chronological steps (columns). |
| `swimlanes` | Array | A list of Swimlane objects representing layers of data (rows). |
| `nodes` | Array | A list of Node objects representing the content at the intersection of stages and swimlanes. |

---

## Stage Object

Represents a chronological step or phase in the journey.

| Element | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique identifier for the stage (e.g., "s1"). |
| `name` | String | Display name for the stage (e.g., "Entry", "Purchase"). |

---

## Swimlane Object

Represents a thematic layer or category of information.

| Element | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique identifier for the swimlane (e.g., "sl1"). |
| `name` | String | Display name for the swimlane (e.g., "User Action", "Pain Point"). |

---

## Node Object

Represents a specific data point or event within the journey map.

| Element | Type | Description |
| :--- | :--- | :--- |
| `stageId` | String | Reference to the `id` of the stage this node belongs to. |
| `swimlaneId` | String | Reference to the `id` of the swimlane this node belongs to. |
| `title` | String | Short title or summary of the node. |
| `description` | String | Detailed content or notes. |
| `severity` | String | Importance or impact level: `low`, `medium`, or `high`. |
| `score` | Number | (Optional) Quantitative value (-5 to +5) for emotional curves or metrics. Defaults to 0. |
| `sentiment` | String | (Optional) Emotional tone (e.g., `frustrated`, `delighted`, `anxious`). |
| `purpose` | String | (Optional) Functional role (e.g., `pain-point`, `touchpoint`, `milestone`). |
| `isMomentOfTruth`| Boolean| (Optional) Flag to mark critical interactions. |
| `icon` | String | (Optional) Display hint for icons (e.g., "search", "mood_bad"). |
| `iconColor`| String | (Optional) Hex code or CSS color for the icon. |
| `tags` | Array | List of strings for categorizing nodes (e.g., ["Mobile", "Issue"]). |

---

## Example OJF Object

```json
{
  "version": "1.0",
  "stages": [
    { "id": "s1", "name": "Discovery" },
    { "id": "s2", "name": "Purchase" }
  ],
  "swimlanes": [
    { "id": "sl1", "name": "User Action" },
    { "id": "sl2", "name": "Emotional State" }
  ],
  "nodes": [
    {
      "stageId": "s1",
      "swimlaneId": "sl1",
      "title": "Search for Product",
      "description": "User uses the search bar to find a specific item.",
      "score": 5,
      "isMomentOfTruth": true,
      "icon": "search",
      "iconColor": "#4f46e5",
      "tags": ["Search", "Desktop"]
    },
    {
      "stageId": "s2",
      "swimlaneId": "sl2",
      "title": "Anxiety",
      "description": "User is worried about payment security.",
      "severity": "medium",
      "sentiment": "anxious",
      "purpose": "pain-point",
      "tags": ["Checkout", "Trust"]
    }
  ]
}
```
