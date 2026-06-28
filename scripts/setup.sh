#!/bin/bash
set -e

echo "🔥 HireFire — Setup Automatizado"
echo "=================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Node.js y nvm
echo "📦 Verificando Node.js..."
if command -v nvm &> /dev/null || [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh" 2>/dev/null || true
    nvm use 22.22.2 2>/dev/null || echo -e "${YELLOW}⚠️  nvm no disponible, usando Node global${NC}"
elif ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no encontrado. Instalar desde https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
echo ""

# 2. Verificar PostgreSQL
echo "🗄️  Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL no encontrado.${NC}"
    echo "   Linux: sudo apt install postgresql postgresql-contrib"
    echo "   Windows: descargar desde https://www.postgresql.org/download/windows/"
    echo "   macOS: brew install postgresql"
    exit 1
fi
PG_VERSION=$(psql --version)
echo -e "${GREEN}✓ ${PG_VERSION}${NC}"
echo ""

# 3. Crear usuario y BD si no existen
echo "🔐 Configurando usuario y base de datos..."
PSQL_CMD="psql -U postgres"

# Verificar si el usuario ya existe
if ! $PSQL_CMD -tAc "SELECT 1 FROM pg_roles WHERE rolname='hirefire'" | grep -q 1; then
    echo "   Creando usuario 'hirefire'..."
    $PSQL_CMD -c "CREATE USER hirefire WITH PASSWORD 'hirefire';"
else
    echo "   Usuario 'hirefire' ya existe"
fi

# Verificar si la BD ya existe
if ! $PSQL_CMD -lAc | grep -q "hirefire"; then
    echo "   Creando base de datos 'hirefire'..."
    $PSQL_CMD -c "CREATE DATABASE hirefire OWNER hirefire;"
else
    echo "   Base de datos 'hirefire' ya existe"
fi
echo -e "${GREEN}✓ BD lista${NC}"
echo ""

# 4. Crear .env si no existe
echo "⚙️  Configurando variables de entorno..."
if [ -f "backend/.env" ]; then
    echo "   backend/.env ya existe"
else
    cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://hirefire:hirefire@localhost:5432/hirefire?schema=public
PORT=3000

# Obtener en https://console.apify.com/account/integrations
APIFY_TOKEN=

# Obtener en https://console.groq.com/keys
GROQ_API_KEY=
EOF
    echo -e "${YELLOW}⚠️  backend/.env creado. Completar APIFY_TOKEN y GROQ_API_KEY${NC}"
fi
echo ""

# 5. Instalar dependencias
echo "📥 Instalando dependencias..."
cd backend
npm ci --silent
cd ../frontend
npm ci --silent
cd ..
echo -e "${GREEN}✓ Dependencias instaladas${NC}"
echo ""

# 6. Migrar BD
echo "🔄 Migrando base de datos..."
cd backend
npm run db:push
cd ..
echo -e "${GREEN}✓ BD migrada${NC}"
echo ""

# 7. Resumen final
echo -e "${GREEN}✅ Setup completado!${NC}"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Abrir backend/.env y completar:"
echo "      - APIFY_TOKEN (de https://console.apify.com/account/integrations)"
echo "      - GROQ_API_KEY (de https://console.groq.com/keys)"
echo ""
echo "   2. Iniciar backend (terminal 1):"
echo "      cd backend && npm run dev"
echo ""
echo "   3. Iniciar frontend (terminal 2):"
echo "      cd frontend && npm start"
echo ""
echo "   4. Abrir en el navegador: http://localhost:4200"
echo ""
