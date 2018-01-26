.. class:: atom
    :heading:

.. |br| raw:: html

   <br />

====
atom
====

Methods
-------

.. class:: atom
    :noindex:
    :hidden:

    .. function:: o(mod)

        :param mod: The module whose context the resulting function should execute in. This is used to determine whether "main" should be executed if the returned function's "main" property is used to construct an object and to aid in resolving the objects "type".
        :type mod: Module
        :rtype: :class:`~atom.ObjectInstantiationFunctions`

        A factory function that returns an instantiation function ``o`` where ``o.main`` is used to execute the "main" handler if in the appropriate context (where ``require.main`` == ``module``)

    .. function:: ObjectInstantiationFunctionMain(datum, type, arg)

        :param datum: An object whose properties are used to initialize the instance. Note, this object may have it's type embedded using the "_type" property. In this case the "type" parameter can be omitted.
        :type datum: Object
        :param type: The type of the object being instantiated. This can be an object, a constructor function, or a string. if it is an object, the new object's prototype will be updated to reflect this. If it is a constructor function, ``util.inherits`` will be called and constructors will be chained upon instantiation. Finally, if it is a string, "@carbon-io/bond" will be used to "reslove" the type, which should be an object or constructor function.
        :type type: Object | function | string
        :param arg: Arguments to be passed to the object's ``_init`` method
        :type arg: ...\*
        :rtype: Object

        The "main" variant of :class:`~atom.ObjectInstantiationFunction`. Use this if you want to invoke "main" after the object has been instantiated in the context of ``require.main``.

    .. function:: ObjectInstantionFunction(datum, type, arg)

        :param datum: An object whose properties are used to initialize the instance. Note, this object may have it's type embedded using the "_type" property. In this case the "type" parameter can be omitted.
        :type datum: Object
        :param type: The type of the object being instantiated. This can be an object, a constructor function, or a string. if it is an object, the new object's prototype will be updated to reflect this. If it is a constructor function, ``util.inherits`` will be called and constructors will be chained upon instantiation. Finally, if it is a string, "@carbon-io/bond" will be used to "reslove" the type, which should be an object or constructor function.
        :type type: Object | function | string
        :param arg: Arguments to be passed to the object's ``_init`` method
        :type arg: ...\*
        :rtype: Object

        Instantiates an object

.. _atom.ObjectInstantiationFunctions:

.. rubric:: Typedef: ObjectInstantiationFunctions

Properties
----------

    .. attribute:: ObjectInstantiationFunctionMain

       :type: :class:`~atom.ObjectInstantiationFunctionMain`
       :required:

       

