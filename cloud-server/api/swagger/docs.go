package swagger

import "github.com/swaggo/swag"

const docTemplate = `{
  "swagger": "2.0",
  "info": {
    "description": "AI-Automated-office Cloud API",
    "title": "AI-Automated-office API",
    "version": "1.0.0"
  },
  "basePath": "/api/v1",
  "paths": {
    "/health": {
      "get": {
        "summary": "Health check",
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/health/liveness": {
      "get": {
        "summary": "Liveness check",
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/health/readiness": {
      "get": {
        "summary": "Readiness check",
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    }
  }
}`

var SwaggerInfo = &swag.Spec{
	Version:          "1.0.0",
	Host:             "",
	BasePath:         "/api/v1",
	Schemes:          []string{"http"},
	Title:            "AI-Automated-office API",
	Description:      "AI-Automated-office Cloud API",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
