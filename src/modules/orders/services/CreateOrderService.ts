import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrderRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomerRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const findCustomer = await this.customersRepository.findById(customer_id);
    if (!findCustomer) throw new AppError('customer nao encontrado');

    const confirmedProducts = await this.productsRepository.findAllById(
      products,
    );

    if (confirmedProducts.length !== products.length)
      throw new AppError('Algum produto nao consta no banco de dados');

    const verifiedProducts = confirmedProducts.map(productItem => {
      const findProduct = products.find(item => item.id === productItem.id);
      if (!findProduct) throw new AppError('product nao encontrado');

      if (findProduct.quantity > productItem.quantity)
        throw new AppError('quantidade maior');

      return {
        product_id: productItem.id,
        price: productItem.price,
        quantity: findProduct.quantity,
      };
    });

    const updateProduct = confirmedProducts.map(productItem => {
      const findProduct = products.find(item => item.id === productItem.id);

      if (!findProduct) throw new AppError('product nao encontrado');

      return {
        quantity: productItem.quantity - findProduct.quantity,
        id: productItem.id,
      };
    });

    const response = await this.ordersRepository.create({
      customer: findCustomer,
      products: verifiedProducts,
    });

    await this.productsRepository.updateQuantity(updateProduct);

    return response;
  }
}

export default CreateOrderService;
