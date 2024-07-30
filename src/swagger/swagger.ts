 let swagger = {
    "openapi": "3.0.0",
    "info": {
      "title": "calendar_integration",
      "version": "1.0.0"
    },
    "servers": [
      {
        "url": "http://localhost:3000"
      }
    ],
    "paths": {
      "/signup": {
        "post": {
          "tags": [
            "default"
          ],
          "summary": "signup",
          "requestBody": {
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "properties": {
                    "email": {
                      "type": "string",
                      "example": "sunidhii2701@gmail.com"
                    },
                    "name": {
                      "type": "string",
                      "example": "admin"
                    },
                    "contactNo": {
                      "type": "integer",
                      "example": "1234567890"
                    },
                    "password": {
                      "type": "string",
                      "example": "Password@123"
                    },
                    "role": {
                      "type": "string",
                      "example": "admin"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful response",
              "content": {
                "application/json": {}
              }
            }
          }
        }
      },
      "/login": {
        "post": {
          "tags": [
            "default"
          ],
          "summary": "login",
          "requestBody": {
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "properties": {
                    "email": {
                      "type": "string",
                      "example": "sunidhii2701@gmail.com"
                    },
                    "password": {
                      "type": "string",
                      "example": "Password@123"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful response",
              "content": {
                "application/json": {}
              }
            }
          }
        }
      },
      "/createNewCalendar": {
        "post": {
          "tags": [
            "default"
          ],
          "summary": "createNewCalendar",
          "requestBody": {
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "properties": {
                    "calendarName": {
                      "type": "string",
                      "example": "admins calendar"
                    },
                    "email": {
                      "type": "string",
                      "example": "sunidhii2701@gmail.com"
                    }
                  }
                }
              }
            }
          },
          "parameters": [
            {
              "name": "token",
              "in": "header",
              "schema": {
                "type": "string"
              },
              "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Njg0ZjdkMjZkNWVlZDI2ZTE1ZTVhZmMiLCJlbWFpbCI6InN1bmlkaGlpMjcwMUBnbWFpbC5jb20iLCJpYXQiOjE3MjAxNjQ2NjgsImV4cCI6MTcyMDI1MTA2OH0.zkoaKmvaOj9NSmOT81zn-Bjn5taFQulFE17zFq2KXOw"
            }
          ],
          "responses": {
            "200": {
              "description": "Successful response",
              "content": {
                "application/json": {}
              }
            }
          }
        }
      },
      "/create-event": {
            "post": {
                "tags": [
                    "default"
                ],
                "summary": "create-event",
                "requestBody": {
                    "content": {
                        "application/x-www-form-urlencoded": {
                            "schema": {
                                "properties": {
                                    "email": {
                                        "type": "string",
                                        "example": "sunidhii2701@gmail.com"
                                    },
                                    "startTime": {
                                        "type": "string",
                                        "example": "14:00"
                                    },
                                    "endTime": {
                                        "type": "string",
                                        "example": "14:30"
                                    },
                                    "summary": {
                                        "type": "string",
                                        "example": "test from admin"
                                    },
                                    "description": {
                                        "type": "string",
                                        "example": "test from admin"
                                    },
                                    "calendarName": {
                                        "type": "string",
                                        "example": "admins calendar"
                                    },
                                    "date": {
                                        "type": "string",
                                        "example": "2024-07-09"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful response",
                        "content": {
                            "application/json": {}
                        }
                    }
                }
            }
        },
      "/fetchEventsFromAllCalendars": {
        "post": {
          "tags": [
            "default"
          ],
          "summary": "get eventsFromAllCalendars",
          "requestBody": {
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "properties": {
                    "userId": {
                      "type": "string",
                      "example": "6684f7d26d5eed26e15e5afc"
                    },
                    "date": {
                      "type": "string",
                      "example": "2024-07-04"
                    },
                    "role": {
                      "type": "string",
                      "example": "employee"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful response",
              "content": {
                "application/json": {}
              }
            }
          }
        }
      },
      "/bookevent": {
        "post": {
          "tags": [
            "default"
          ],
          "summary": "bookSlot",
          "requestBody": {
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "properties": {
                    "eventId": {
                      "type": "string",
                      "example": "991sm30rjiq7ri1bdj7umqilss"
                    },
                    "email": {
                      "type": "string",
                      "example": "exmple@gmail.com"
                    },
                    "name": {
                      "type": "string",
                      "example": "example user "
                    },
                    "contactNo": {
                      "type": "integer",
                      "example": "111111111"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful response",
              "content": {
                "application/json": {}
              }
            }
          }
        }
      }
    }
  }

  module.exports = swagger;
