// src/components/prestamos/PrestamoCard.tsx - ACTUALIZADA CON FECHA DE INICIO Y DÍAS DE ATRASO
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  DollarSign, 
  User, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Infinity,
  CreditCard,
  Calendar,
  Percent,
  CalendarDays,
  AlertTriangle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Prestamo, Cliente } from '@/types/database'

// Función para convertir fechas de Firestore
const convertFirebaseDate = (fecha: any): Date | null => {
  try {
    if (!fecha) return null
    if (fecha instanceof Date) {
      return isNaN(fecha.getTime()) ? null : fecha
    }
    if (fecha.toDate && typeof fecha.toDate === 'function') {
      const convertida = fecha.toDate()
      return isNaN(convertida.getTime()) ? null : convertida
    }
    return null
  } catch {
    return null
  }
}

// Función para calcular días de atraso
const calcularDiasAtraso = (fechaVencimiento: Date | null, fechaProximoPago: Date | null): number => {
  const hoy = new Date()
  const fecha = fechaVencimiento || fechaProximoPago
  
  if (!fecha) return 0
  
  const diffTime = hoy.getTime() - fecha.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

interface PrestamoCardProps {
  prestamo: Prestamo
  cliente: Cliente
  onEdit?: (prestamo: Prestamo) => void
  onDelete?: (prestamo: Prestamo) => void
  onViewDetails?: (prestamo: Prestamo) => void
  onRegisterPayment?: (prestamo: Prestamo) => void
}

export function PrestamoCard({ 
  prestamo, 
  cliente, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onRegisterPayment 
}: PrestamoCardProps) {

  // Detección de préstamos indefinidos
  const esPrestamoIndefinido = prestamo.esPlazoIndefinido === true || 
                              prestamo.tipoTasa === 'indefinido'

  // Función para calcular la próxima fecha de pago quincenal (15 o 30 del mes)
  const calcularProximaFechaPagoQuincenal = (): Date => {
    const hoy = new Date()
    const dia = hoy.getDate()
    const mes = hoy.getMonth()
    const año = hoy.getFullYear()
    
    if (dia < 15) {
      return new Date(año, mes, 15)
    } else if (dia < 30) {
      const ultimoDiaDelMes = new Date(año, mes + 1, 0).getDate()
      const diaPago = Math.min(30, ultimoDiaDelMes)
      return new Date(año, mes, diaPago)
    } else {
      return new Date(año, mes + 1, 15)
    }
  }

  // Calcular próximo pago
  const calcularProximoPagoReal = () => {
    const saldoCapital = prestamo.saldoCapital || prestamo.monto || 0
    const tasaInteres = prestamo.tasaInteres || 0

    if (saldoCapital <= 0 || tasaInteres <= 0) {
      return { monto: 0, fecha: new Date(), esValido: false }
    }

    if (esPrestamoIndefinido) {
      const interesesQuincenales = saldoCapital * (tasaInteres / 100)
      const proximaFechaPago = calcularProximaFechaPagoQuincenal()
      
      return { 
        monto: interesesQuincenales, 
        fecha: proximaFechaPago, 
        esValido: true,
        esIndefinido: true
      }
    } else {
      const montoCuota = prestamo.montoProximoPago || 0
      let fechaProximoPago = null
      
      if (prestamo.fechaProximoPago) {
        fechaProximoPago = convertFirebaseDate(prestamo.fechaProximoPago)
      }
      
      if (!fechaProximoPago && prestamo.fechaInicio) {
        const fechaInicio = convertFirebaseDate(prestamo.fechaInicio)
        if (fechaInicio) {
          fechaProximoPago = new Date(fechaInicio)
          switch (prestamo.tipoTasa) {
            case 'mensual':
              fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1)
              break
            case 'quincenal':
              fechaProximoPago.setDate(fechaProximoPago.getDate() + 15)
              break
            case 'anual':
              fechaProximoPago.setFullYear(fechaProximoPago.getFullYear() + 1)
              break
            default:
              fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1)
          }
        }
      }
      
      if (!fechaProximoPago) {
        fechaProximoPago = new Date()
        switch (prestamo.tipoTasa) {
          case 'mensual':
            fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1)
            break
          case 'quincenal':
            fechaProximoPago.setDate(fechaProximoPago.getDate() + 15)
            break
          case 'anual':
            fechaProximoPago.setFullYear(fechaProximoPago.getFullYear() + 1)
            break
          default:
            fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1)
        }
      }

      return { 
        monto: montoCuota || (saldoCapital * (tasaInteres / 100)), 
        fecha: fechaProximoPago, 
        esValido: true,
        esIndefinido: false
      }
    }
  }

  const proximoPago = calcularProximoPagoReal()

  // Calcular progreso y fechas importantes
  const saldoCapital = prestamo.saldoCapital || prestamo.monto
  const progreso = ((prestamo.monto - saldoCapital) / prestamo.monto) * 100
  const fechaInicio = convertFirebaseDate(prestamo.fechaInicio)
  const fechaVencimiento = convertFirebaseDate(prestamo.fechaVencimiento)
  const fechaProximoPago = convertFirebaseDate(prestamo.fechaProximoPago)

  // ✅ CALCULAR DÍAS DE ATRASO
  const diasAtraso = calcularDiasAtraso(fechaVencimiento, fechaProximoPago)
  const tieneAtraso = diasAtraso > 0

  // Estados y iconos
  const getEstadoIcon = () => {
    switch (prestamo.estado) {
      case 'activo': return <Clock className="h-3 w-3" />
      case 'finalizado': return <CheckCircle className="h-3 w-3" />
      case 'atrasado': return <AlertCircle className="h-3 w-3" />
      default: return <XCircle className="h-3 w-3" />
    }
  }

  const getBadgeVariant = () => {
    switch (prestamo.estado) {
      case 'activo': return 'default'
      case 'finalizado': return 'secondary'
      case 'atrasado': return 'destructive'
      default: return 'outline'
    }
  }

  // Manejadores de eventos
  const handleViewDetails = () => onViewDetails?.(prestamo)
  const handleEdit = () => onEdit?.(prestamo)
  const handleDelete = () => onDelete?.(prestamo)
  const handleRegisterPayment = () => onRegisterPayment?.(prestamo)

  return (
    <div className="group bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
      
      {/* ✅ HEADER CON INFORMACIÓN BÁSICA */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 truncate">{prestamo.numero}</h2>
            <Badge variant={getBadgeVariant()} className="flex items-center gap-1 text-xs">
              {getEstadoIcon()}
              {prestamo.estado}
            </Badge>
            {/* ✅ BADGE DE ATRASO */}
            {tieneAtraso && (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                {diasAtraso}d atraso
              </Badge>
            )}
          </div>
          
          <div className="flex items-center text-gray-600 text-sm">
            <User className="h-4 w-4 mr-1.5 text-gray-400" />
            <span className="font-medium truncate">{cliente.nombre} {cliente.apellido}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleViewDetails} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Ver Detalles
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {onRegisterPayment && prestamo.estado === 'activo' && (
              <DropdownMenuItem onClick={handleRegisterPayment} className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Registrar Pago
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ✅ INFORMACIÓN FINANCIERA */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wider">Monto Original</span>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(prestamo.monto)}</div>
        </div>
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wider">Saldo Actual</span>
          <div className="text-lg font-bold text-blue-600">{formatCurrency(saldoCapital)}</div>
        </div>
      </div>

      {/* ✅ FECHAS IMPORTANTES - NUEVA SECCIÓN */}
      <div className="border-t border-gray-100 pt-4 mb-5">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Fechas Importantes
        </h4>
        
        <div className="space-y-2">
          {/* ✅ FECHA DE INICIO - AGREGADA */}
          {fechaInicio && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Fecha de inicio:</span>
              <span className="font-medium">{formatDate(fechaInicio)}</span>
            </div>
          )}

          {/* Próximo pago */}
          {proximoPago.esValido && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Próximo pago:</span>
              <span className={`font-medium ${tieneAtraso ? 'text-red-600' : ''}`}>
                {formatDate(proximoPago.fecha)}
              </span>
            </div>
          )}

          {/* Fecha de vencimiento (solo para préstamos con plazo) */}
          {fechaVencimiento && !esPrestamoIndefinido && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Vencimiento:</span>
              <span className="font-medium">{formatDate(fechaVencimiento)}</span>
            </div>
          )}

          {/* ✅ INFORMACIÓN DE ATRASO - AGREGADA */}
          {tieneAtraso && (
            <div className="flex justify-between items-center text-sm p-2 bg-red-50 rounded-md border border-red-100">
              <span className="text-red-700 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Días de atraso:
              </span>
              <span className="font-bold text-red-600">{diasAtraso} días</span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ DETALLES DEL PRÉSTAMO */}
      <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wider">Tasa de Interés</span>
          <div className="font-semibold flex items-center gap-1">
            <Percent className="h-3 w-3 text-gray-400" />
            {prestamo.tasaInteres}% {esPrestamoIndefinido ? 'Quincenal' : prestamo.tipoTasa}
          </div>
        </div>
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wider">Plazo</span>
          <div className="font-semibold">
            {esPrestamoIndefinido ? (
              <span className="text-purple-600 flex items-center gap-1">
                <Infinity className="h-3 w-3" />
                Indefinido
              </span>
            ) : prestamo.plazo ? (
              `${prestamo.plazo} ${prestamo.tipoTasa}${prestamo.plazo > 1 ? 's' : ''}`
            ) : 'No definido'}
          </div>
        </div>
      </div>

      {/* ✅ PROGRESO Y PRÓXIMO PAGO */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progreso del pago</span>
            <span className="text-sm font-medium">{progreso.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progreso >= 100 ? 'bg-green-500' : progreso >= 75 ? 'bg-blue-500' : 'bg-blue-400'
              }`}
              style={{ width: `${Math.min(progreso, 100)}%` }}
            />
          </div>
        </div>

        {proximoPago.esValido && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Próximo pago</div>
              <div className={`text-lg font-bold ${tieneAtraso ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(proximoPago.monto)}
              </div>
            </div>
            {onRegisterPayment && prestamo.estado === 'activo' && (
              <Button 
                size="sm" 
                onClick={handleRegisterPayment}
                className={tieneAtraso ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {tieneAtraso ? 'Pagar Ahora' : 'Registrar Pago'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}