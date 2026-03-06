# Front para la aplicación Geoespacial

Se aplican 5 pilares para este proyecto:

**1**
**Separación de UI y Manejo de Datos (Lógica vs. Presentación)**

    Se utiliza Services para la lógica y solo se llama en los componentes

**2**
**Single Source of Truth (Fuente única de verdad)**

    Un dato que se pide vive para toda la aplicación en un solo lugar.

**3**
**Cumplir las reglas del Framework (Vue 3)**

    Se utiliza estrictamente Composition Api, solo sintaxis de Vue 3.

**4**
**No reinventar la rueda (Componentes Reutilizables)**

    Se utilizan componentes y librerías que ayuden a resolver problemas de lógica y presentacion sin que nosotros tengamos que crear uno nuevo desde 0.

**5**
**Gestión de Estados Complejos**

    Se programan maquinas de estado, previniendo que pasa en cada combination posible de estados para que al aplicación no se rompa. (idle, loading, success, error)

**Ademas se implementa arquitectura micro-front-ends basada en privilegios y componentes dinámicos**
