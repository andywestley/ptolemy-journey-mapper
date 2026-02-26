James Kalbach’s *Mapping Experiences* is the perfect foundation for your project. While Jeff Patton focuses on software feature delivery, Kalbach focuses on **value-centered design**—visualizing the intersection between human behavior and an organization's offerings to build empathy and strategic alignment.

Here is a summary of the key features of experience mapping from Kalbach's perspective, followed by a review of how your Ptolemy application and OpenJourney Format (`.ojf`) align with them.

### Key Features of Experience Mapping 
Kalbach uses the umbrella term **"alignment diagrams"** for artifacts like Customer Journey Maps, Experience Maps, and Service Blueprints. These diagrams share fundamental principles:
*   **Individuals vs. Organization:** They always visualize two sides of value creation. One side depicts the individual's experience (actions, thoughts, feelings), and the other depicts the organization's offerings (backstage processes, roles, metrics). 
*   **Multiplicity:** They display multiple facets of information simultaneously across horizontal rows (e.g., goals, pain points, touchpoints).
*   **Chronological Structure:** Most journey maps and blueprints use a chronological structure (a timeline) to show how an experience unfolds over time.
*   **Touchpoints & Moments of Truth:** They expose **touchpoints** (the specific points of interaction) and highlight **moments of truth** (critical, emotionally charged interactions that make or break the relationship).
*   **Emotions and Quantitative Data:** Good maps visualize the "ups and downs" of an experience, frequently using emotional curves, satisfaction scores, or other quantitative metrics plotted over the timeline.
*   **Personas / Point of View:** A map must have a specific point of view, grounded by a narrative description of a user archetype (a persona).

---

### Reviewing the OpenJourney Format (`.ojf`) Specification
Your `.ojf` schema is remarkably well-suited to Kalbach's principles for chronological maps (Customer Journey Maps, Service Blueprints, and Experience Maps). 

**Where it aligns:**
*   **Chronology and Multiplicity:** Kalbach's "timeline" maps perfectly to your `stages` array (columns), and his "multiplicity" principle maps perfectly to your `swimlanes` array (rows). 
*   **Flexibility:** Because your `swimlanes` are customizable thematic layers (e.g., "User Action", "Pain Point"), the schema is flexible enough to accommodate different map types. A user could create a Service Blueprint by adding "Line of Visibility" and "Backstage Processes" swimlanes, or a Customer Journey Map by adding "Thoughts" and "Feelings" swimlanes.

**Gaps and Recommendations:**
*   **Root Metadata for Personas:** Kalbach stresses that an experience map is the subjective perception of a specific individual. You should consider adding `persona` and `pointOfView` strings to the Root Object so the JSON explicitly states *whose* journey is being mapped.
*   **Quantitative Values for Nodes:** Kalbach frequently uses graphs to show satisfaction scores, importance, or emotional curves across stages. Currently, your `Node` object only holds text (`title`, `description`) and a `severity` string. Adding an optional numeric `score` or `value` field to the Node would allow the data to natively represent graphs or emotional highs/lows.
*   **Moments of Truth:** Because moments of truth are the most critical innovation opportunities in a journey, you might want to add a boolean `isMomentOfTruth` to the `Node` object, or encourage "Moment of Truth" as a standardized entry in your `tags` array.
*   **Diagram Type Limitation:** Kalbach notes that alignment diagrams can also be *Hierarchical* (Mental Model Diagrams) or *Spatial* (Ecosystem Maps). Because OJF strictly defines chronological `stages`, it won't natively support these non-linear map types. This isn't necessarily a problem, but it means OJF is specifically a standard for *chronological* journeys.

---

### Reviewing the Ptolemy Application Requirements
Your application requirements strongly support the collaborative, strategic intent of experience mapping.

**Where it aligns:**
*   **Collaboration:** Kalbach emphasizes that diagrams are not just deliverables; they are "campfires" used to foster conversations and break down departmental silos. Your multi-user PocketBase backend with `collaborators` perfectly enables this.
*   **Visual Export:** Kalbach states that the immediacy of a visualization is what gives it impact over a written report. Your requirement for PNG/SVG export ensures the maps can be socialized across an organization.

**Gaps and Recommendations:**
*   **Visualizing Curves vs. Grids:** Your Visual Map View requirement specifies a "DOM-based (not Canvas) visual representation... using CSS Grid". While a grid is great for text nodes, Kalbach's maps rely heavily on plotting lines to show emotional paths or quantitative data over time. You should ensure your frontend architecture allows for drawing connecting lines or curves (e.g., using SVG overlays on top of the CSS Grid) to represent these emotional journeys.
*   **Visual Empathy (Images and Icons):** Kalbach notes that icons, emoticons, and photos increase the efficiency and empathy of the map. Since PocketBase has built-in file storage, you should consider allowing users to attach images or icons to a `Node`, which would make the Visual Map View much richer.
*   **Workshop / Evaluation Tools:** A major part of Kalbach's methodology is the "Alignment Workshop" where teams grade performance, vote on pain points, and brainstorm ideas directly on the map. You could easily extend Ptolemy to include a "Workshop Mode" where users can add comments or "dot-vote" on specific nodes to prioritize opportunities.