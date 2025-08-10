La idea fue hacer un turnero mediante una base de datos/api falsa. use mockapi en este caso, la idea es cargarle los turnos a la base de datos (GET) https://68986d7bddf05523e55edf19.mockapi.io/clases/clases
para luego poder verlas/escucharlas mediante fetch y el calendario. Luego cargar el turno mediante formulario (POST) y que se cargue toda la informacion en https://68986d7bddf05523e55edf19.mockapi.io/clases/reservas.

Trate de usar las librerias que mencionaron, el calendario lo pude ejecutar pero tuve varios problemas mas que nada con las fechas. Se me hizo bastante engorroso y me encontre con varios problemas
el mas importante creo yo es que estaba desfasado los datos que le cargue en mockapi de las clases (fechas) con respecto a las fechas de las funciones date. Buscando logre encontrar que posiblemente sea un tema
de zona horaria, asi que no me quedo otra que tener que buscar la solucion por afuera para meterle un parche. La base de datos me quedo desfasada, 1 dia antes, pero al usuario en teoria no le afecta por que pude
sumarle 1 dia a todas las fechas seteando la zona horaria local en UTC.

La verdad es que por momentos se me hizo muy complejo trabajar con el tema fechas, y todo lo que es dom y eventos tambien me costo demasiado.
