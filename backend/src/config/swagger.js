import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todolist App API',
      version: '1.0.0',
      description: 'Todolist App REST API 문서',
    },
    servers: [{ url: '/api', description: 'API 서버' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, '../modules/**/*.router.js')],
};

export const swaggerSpec = swaggerJsdoc(options);
