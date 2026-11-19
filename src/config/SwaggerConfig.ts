import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    failOnErrors: true,
    definition: {
        openapi: '3.0.3',
        info: {
        title: 'Fixer Marketplace API',
        version: '1.0.0',
        description: 'Documentación de la API REST de Fixer Marketplace.'
        },
        servers: [
        {
            url: '/api/v1',
            description: 'Servidor de Fixer'
        }
        ],
        components: {
        securitySchemes: {
            bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
            }
        },
        schemas: {
            SuccessResponse: {
            type: 'object',
            required: ['success', 'data'],
            properties: {
                success: {
                type: 'boolean',
                example: true
                },
                message: {
                type: 'string',
                example: 'Operación exitosa'
                },
                data: {}
            }
            },
            ErrorResponse: {
            type: 'object',
            required: ['success', 'message', 'error'],
            properties: {
                success: {
                type: 'boolean',
                example: false
                },
                message: {
                type: 'string',
                example: 'Ocurrió un error'
                },
                error: {
                type: 'object',
                properties: {
                    details: {}
                }
                }
            }
            },
            PaginationMeta: {
            type: 'object',
            required: ['page', 'limit', 'total', 'totalPages'],
            properties: {
                page: {
                type: 'integer',
                example: 1
                },
                limit: {
                type: 'integer',
                example: 10
                },
                total: {
                type: 'integer',
                example: 25
                },
                totalPages: {
                type: 'integer',
                example: 3
                }
            }
            },
            AuthUser: {
            type: 'object',
            required: [
                'id',
                'fullName',
                'email',
                'phone',
                'role',
                'isPro'
            ],
            properties: {
                id: {
                type: 'string'
                },
                fullName: {
                type: 'string',
                example: 'Juan Pérez'
                },
                email: {
                type: 'string',
                format: 'email',
                example: 'juan@example.com'
                },
                phone: {
                type: 'string',
                example: '2915551234'
                },
                role: {
                type: 'string',
                example: 'CLIENT'
                },
                avatarUrl: {
                type: 'string',
                nullable: true,
                example: null
                },
                isPro: {
                type: 'boolean',
                example: false
                }
            }
            },
            AuthResponse: {
            allOf: [
                {
                $ref: '#/components/schemas/SuccessResponse'
                },
                {
                type: 'object',
                properties: {
                    data: {
                    type: 'object',
                    required: ['user', 'token'],
                    properties: {
                        user: {
                        $ref: '#/components/schemas/AuthUser'
                        },
                        token: {
                        type: 'string',
                        description: 'Token JWT de autenticación',
                        example: 'eyJhbGciOiJIUzI1NiJ9...'
                        }
                    }
                    }
                }
                }
            ]
            }
        },
        responses: {
            Unauthorized: {
            description: 'No autorizado',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            Forbidden: {
            description: 'Permisos insuficientes',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            NotFound: {
            description: 'Recurso no encontrado',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            Conflict: {
            description: 'Conflicto con un recurso existente',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            ValidationError: {
            description: 'Error de validación de datos',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            InternalServerError: {
            description: 'Error interno del servidor',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            }
        }
        }
    },
    apis: [
    `${__dirname}/../app.{ts,js}`,
    `${__dirname}/../modules/**/routes/*.{ts,js}`
    ]
};

export const swaggerSpec = swaggerJsdoc(options);