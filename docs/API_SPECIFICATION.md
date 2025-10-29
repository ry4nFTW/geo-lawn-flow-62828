# OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Landscape Job Organizer API
  version: 1.0.0
  description: Mobile-first landscape job management system

paths:
  # Authentication
  /auth/login:
    post:
      summary: Google OAuth login
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                id_token:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'

  # Jobs Management
  /api/jobs:
    get:
      summary: List jobs with filters
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [scheduled, in_progress, completed]
        - name: crew_id
          in: query
          schema:
            type: string
            format: uuid
        - name: date_from
          in: query
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Jobs list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Job'

    post:
      summary: Create new job
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JobCreate'
      responses:
        '201':
          description: Job created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Job'

  /api/jobs/{jobId}/auto-populate:
    post:
      summary: Get auto-population suggestions
      parameters:
        - name: jobId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Auto-population suggestions
          content:
            application/json:
              schema:
                type: object
                properties:
                  suggested_price:
                    type: number
                  estimated_duration:
                    type: integer
                  confidence_score:
                    type: integer
                  factors:
                    type: object

  # Visits & Check-ins
  /api/visits/checkin:
    post:
      summary: Crew check-in with geofence verification
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                job_id:
                  type: string
                  format: uuid
                latitude:
                  type: number
                longitude:
                  type: number
                timestamp:
                  type: string
                  format: date-time
      responses:
        '200':
          description: Check-in successful
        '400':
          description: Geofence violation
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                  distance_from_job:
                    type: number

  /api/visits/{visitId}/checkout:
    post:
      summary: Crew check-out
      parameters:
        - name: visitId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                latitude:
                  type: number
                longitude:
                  type: number
                notes:
                  type: string
      responses:
        '200':
          description: Check-out successful

  # Media Upload
  /api/visits/{visitId}/media:
    post:
      summary: Upload before/after photos
      parameters:
        - name: visitId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                type:
                  type: string
                  enum: [before, after, progress]
                latitude:
                  type: number
                longitude:
                  type: number
                captured_at:
                  type: string
                  format: date-time
      responses:
        '201':
          description: Media uploaded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Media'

  # Route Optimization
  /api/routes/optimize:
    post:
      summary: Optimize crew routes
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                crew_id:
                  type: string
                  format: uuid
                job_ids:
                  type: array
                  items:
                    type: string
                    format: uuid
                start_location:
                  type: object
                  properties:
                    latitude:
                      type: number
                    longitude:
                      type: number
      responses:
        '200':
          description: Optimized route
          content:
            application/json:
              schema:
                type: object
                properties:
                  optimized_order:
                    type: array
                    items:
                      type: string
                      format: uuid
                  total_distance:
                    type: number
                  estimated_time:
                    type: integer

  # Chat System
  /api/chat/{customerId}/messages:
    get:
      summary: Get chat messages
      parameters:
        - name: customerId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Chat messages
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ChatMessage'

    post:
      summary: Send chat message
      parameters:
        - name: customerId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                media_url:
                  type: string
      responses:
        '201':
          description: Message sent

  # Payments
  /api/payments/process:
    post:
      summary: Process payment
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                invoice_id:
                  type: string
                  format: uuid
                payment_method:
                  type: string
                  enum: [paypal, stripe, cash_app, check]
                payment_token:
                  type: string
                amount:
                  type: number
      responses:
        '200':
          description: Payment processed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Payment'

  # Exports
  /api/exports/journal-entries:
    post:
      summary: Generate QuickBooks journal entry export
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                date_from:
                  type: string
                  format: date
                date_to:
                  type: string
                  format: date
                include_per_job_lines:
                  type: boolean
      responses:
        '200':
          description: CSV export generated
          content:
            text/csv:
              schema:
                type: string

  # Sync Endpoints
  /api/sync/conflicts:
    get:
      summary: Get sync conflicts for resolution
      responses:
        '200':
          description: Pending conflicts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/SyncConflict'

    post:
      summary: Resolve sync conflicts
      requestBody:
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  conflict_id:
                    type: string
                  resolution:
                    type: string
                    enum: [server_wins, client_wins, merge]
      responses:
        '200':
          description: Conflicts resolved

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
        name:
          type: string
        role:
          type: string
          enum: [crew, manager, accountant, customer]

    Job:
      type: object
      properties:
        id:
          type: string
          format: uuid
        customer_id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        address:
          type: string
        location:
          type: object
          properties:
            latitude:
              type: number
            longitude:
              type: number
        estimated_duration:
          type: integer
        suggested_price:
          type: number
        auto_populated_confidence:
          type: integer
        status:
          type: string
          enum: [scheduled, in_progress, completed, cancelled]

    JobCreate:
      type: object
      required:
        - customer_id
        - title
        - address
      properties:
        customer_id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        address:
          type: string
        scheduled_date:
          type: string
          format: date

    Media:
      type: object
      properties:
        id:
          type: string
          format: uuid
        visit_id:
          type: string
          format: uuid
        file_path:
          type: string
        file_type:
          type: string
          enum: [before, after, progress]
        checksum:
          type: string
        captured_at:
          type: string
          format: date-time

    ChatMessage:
      type: object
      properties:
        id:
          type: string
          format: uuid
        sender_type:
          type: string
          enum: [customer, crew, manager]
        message:
          type: string
        media_url:
          type: string
        created_at:
          type: string
          format: date-time

    Payment:
      type: object
      properties:
        id:
          type: string
          format: uuid
        invoice_id:
          type: string
          format: uuid
        amount:
          type: number
        processor:
          type: string
        status:
          type: string
          enum: [pending, completed, failed, refunded]

    SyncConflict:
      type: object
      properties:
        id:
          type: string
        table_name:
          type: string
        record_id:
          type: string
        local_data:
          type: object
        server_data:
          type: object
        conflict_type:
          type: string
          enum: [update_conflict, delete_conflict]

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```