export const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

export const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

export const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const isExpenseMovement = (movimiento) => {
  const tipo = movimiento?.tipo_movimiento;
  return ['gasto', 'gasto_grupal', 'gasto_individual'].includes(tipo);
};

export const getMovementPlanId = (movimiento) =>
  movimiento?.plan ?? movimiento?.plan_id ?? movimiento?.plan_detalle?.id ?? null;

export const getMovementGroupId = (movimiento) => {
  const grupo = movimiento?.grupo;
  if (grupo && typeof grupo === 'object') return grupo.id ?? null;
  return grupo ?? movimiento?.grupo_id ?? movimiento?.plan_grupo ?? null;
};

export const getPlanGroupId = (plan) => {
  const grupo = plan?.grupo;
  if (grupo && typeof grupo === 'object') return grupo.id ?? null;
  return grupo ?? null;
};

export const getPlanMovements = (plan, movimientos = []) => {
  const planId = plan?.id;
  const groupId = getPlanGroupId(plan);

  return movimientos.filter((movimiento) => {
    const movimientoPlanId = getMovementPlanId(movimiento);
    const movimientoGroupId = getMovementGroupId(movimiento);

    if (planId && movimientoPlanId && Number(movimientoPlanId) === Number(planId)) {
      return true;
    }

    if (groupId && movimientoGroupId && Number(movimientoGroupId) === Number(groupId)) {
      return true;
    }

    return false;
  });
};

export const getParticipantCount = (plan, participaciones = [], movimiento = null) => {
  const embeddedCount =
    movimiento?.participantes?.length ||
    movimiento?.usuarios_involucrados?.length ||
    movimiento?.integrantes?.length ||
    Number(movimiento?.cantidad_participantes) ||
    Number(movimiento?.dividido_entre) ||
    0;

  if (embeddedCount > 0) return embeddedCount;

  const groupId = getPlanGroupId(plan);
  const related = participaciones.filter((item) => {
    const itemGroupId = item?.grupo ?? item?.grupo_id ?? item?.plan_grupo ?? null;
    return groupId && itemGroupId && Number(itemGroupId) === Number(groupId);
  });

  return Math.max(related.length, 1);
};

export const getMovementUserId = (movimiento) => {
  if (typeof movimiento?.usuario === 'object') return movimiento.usuario.id ?? null;
  return (
    movimiento?.usuario ??
    movimiento?.usuario_id ??
    movimiento?.creado_por ??
    movimiento?.pagado_por ??
    movimiento?.owner ??
    null
  );
};

export const getPaymentBreakdown = ({ plan, movimientos = [], participaciones = [], currentUserId }) => {
  const expenseMovements = movimientos.filter(isExpenseMovement);

  return expenseMovements.reduce(
    (acc, movimiento) => {
      const monto = Number(movimiento?.monto || 0);
      if (!monto) return acc;

      const participants = Math.max(getParticipantCount(plan, participaciones, movimiento), 1);
      const share = monto / participants;
      const ownerId = getMovementUserId(movimiento);
      const canResolveOwner = ownerId && currentUserId;
      const isMine = canResolveOwner && Number(ownerId) === Number(currentUserId);

      acc.total += monto;
      acc.myShare += share;

      if (!canResolveOwner) {
        return acc;
      }

      if (isMine) {
        const receivable = Math.max(monto - share, 0);
        if (receivable > 0.009) {
          acc.pending.push({
            id: `receivable-${movimiento.id}`,
            type: 'receivable',
            title: movimiento.descripcion || 'Gasto registrado',
            amount: receivable,
            caption: `Te deben ${formatCurrency(receivable)} de este gasto.`,
          });
          acc.toReceive += receivable;
        }
      } else {
        acc.pending.push({
          id: `payable-${movimiento.id}`,
          type: 'payable',
          title: movimiento.descripcion || 'Gasto compartido',
          amount: share,
          caption: `Tú debes ${formatCurrency(share)} por este movimiento.`,
        });
        acc.toPay += share;
      }

      return acc;
    },
    { total: 0, myShare: 0, toReceive: 0, toPay: 0, pending: [] }
  );
};