# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go mod files from backend directory
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code from backend directory
COPY backend/ .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"] 